"use server";

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { buildSubmissionSchema } from "@/lib/validators/registration-submission";
import type { InputField, OptionCounts, AdditionalPersonData, CapacityLimit, PricingDefinition } from "@/lib/types/registration-form";
import { getAllFields, getAllInputFields, getAPInputFields, MAX_ADDITIONAL_PEOPLE } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getOptionCountsForYearFresh } from "@/lib/services/registration";
import { getAPFieldNames } from "@/lib/utils/additional-people";
import { computePricingSummary } from "@/lib/utils/pricing-summary";
import { parseQuantities } from "@/lib/utils/pricing-field-values";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";
import { generateUniqueVariableSymbol } from "@/lib/utils/variable-symbol";
import { czechAccountToIBAN, generateSPAYD, formatCzechAccount } from "@/lib/utils/spayd";
import { sendConfirmationEmail, replacePlaceholders, buildPlaceholders, generateQRPaymentImage, appendConditionalSections, collectMatchingSectionAttachments } from "@/lib/utils/email";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import type { ConditionRule, FormCondition } from "@/lib/types/registration-form";
import { evaluateCondition } from "@/lib/utils/condition-evaluation";
import { getPublicSession } from "@/lib/public-auth";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { buildVisibleFieldIds } from "@/lib/utils/visible-fields";

export interface PaymentData {
    totalAmount: number;
    variableSymbol: string;
    bankAccount: string;
    iban: string;
    swift: string | null;
    spaydString: string;
}

export interface RegistrationState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    apErrors?: Record<number, Record<string, string[]>>;
    registrationId?: string;
    variableSymbol?: string;
    totalPrice?: number;
    paymentData?: PaymentData;
}

/**
 * Validate submitted values against capacity limits.
 * Returns field-level error if any capacity is exceeded.
 */
function validateCapacityLimits(
    capacityLimits: CapacityLimit[],
    submissionData: Record<string, unknown>,
    additionalPeople: AdditionalPersonData[],
    allInputFields: InputField[],
    pricingDefinitions: PricingDefinition[],
    optionCounts: OptionCounts,
): { fieldName: string; error: string } | null {
    for (const limit of capacityLimits) {
        const field = allInputFields.find((f) => f.id === limit.fieldId);
        if (!field) continue;

        const currentCount = optionCounts[field.name]?.[limit.value] ?? 0;

        // Count how many times this value appears in current submission
        let submittedCount = 0;

        if (field.type === "pricing_quantity") {
            // Sum quantities for this option across main + AP. Quantity JSON is
            // keyed by opt.id in the form; tolerate opt.name as a fallback.
            const def = pricingDefinitions.find((d) => d.id === field.pricingId);
            const opt = def?.options.find((o) => o.name === limit.value);
            const sumQty = (raw: unknown): number => {
                const qMap = parseQuantities(raw);
                const byId = opt ? Number(qMap[opt.id]) || 0 : 0;
                const byName = Number(qMap[limit.value]) || 0;
                return byId || byName;
            };
            submittedCount += sumQty(submissionData[field.name]);
            for (const person of additionalPeople) {
                submittedCount += sumQty(person[field.name]);
            }
        } else {
            const mainVal = String(submissionData[field.name] ?? "");
            if (field.type === "pricing_multi_select" && mainVal.startsWith("[")) {
                try {
                    const arr = JSON.parse(mainVal);
                    if (Array.isArray(arr) && arr.includes(limit.value)) submittedCount++;
                } catch { /* ignore */ }
            } else if (mainVal === limit.value) {
                submittedCount++;
            }
            for (const person of additionalPeople) {
                const personVal = String(person[field.name] ?? "");
                if (field.type === "pricing_multi_select" && personVal.startsWith("[")) {
                    try {
                        const arr = JSON.parse(personVal);
                        if (Array.isArray(arr) && arr.includes(limit.value)) submittedCount++;
                    } catch { /* ignore */ }
                } else if (personVal === limit.value) {
                    submittedCount++;
                }
            }
        }

        if (submittedCount > 0 && currentCount + submittedCount > limit.maxCount) {
            return {
                fieldName: field.name,
                error: `Kapacita pro "${limit.value}" je již vyčerpána`,
            };
        }
    }
    return null;
}

export async function submitDynamicRegistration(
    prevState: RegistrationState | null,
    formData: FormData
): Promise<RegistrationState> {
    const isTest = formData.get("__test") === "true";

    // Get active year with form. Test submissions bypass the `registrationOpen`
    // check so editors can validate the flow before opening registration.
    const activeYear = await db.year.findFirst({
        where: {
            isActive: true,
            isArchived: false,
            ...(isTest ? {} : { registrationOpen: true }),
        },
        select: {
            id: true,
            title: true,
            subtitle: true,
            year: true,
            confirmationEmailEnabled: true,
            confirmationEmailSubject: true,
            confirmationEmailBody: true,
            confirmationEmailBcc: true,
            confirmationEmailAccountId: true,
            confirmationEmailSections: true,
            confirmationEmailAttachments: true,
            registrationForm: {
                select: { id: true, fields: true },
            },
        },
    });

    if (!activeYear) {
        return {
            success: false,
            message: "Registrace není momentálně otevřena",
        };
    }

    if (!activeYear.registrationForm) {
        return {
            success: false,
            message: "Registrační formulář není nakonfigurován",
        };
    }

    const formDataStored = migrateFormData(activeYear.registrationForm.fields);
    const allFields = getAllFields(formDataStored.fields);
    const allInputFields = getAllInputFields(formDataStored.fields);

    // Build raw data from form
    const rawData: Record<string, unknown> = {};
    for (const field of allInputFields) {
        const value = formData.get(field.name);
        if (field.type === "checkbox") {
            rawData[field.name] = value === "true";
        } else if (field.type === "number") {
            rawData[field.name] = value ? Number(value) : "";
        } else {
            rawData[field.name] = value ?? "";
        }
    }

    // Fetch option counts if capacity limits exist
    const hasCapacityLimits = formDataStored.capacityLimits.length > 0;
    let optionCounts: OptionCounts | undefined;

    if (hasCapacityLimits) {
        optionCounts = await getOptionCountsForYearFresh(activeYear.id);
    }

    // Build visible field IDs
    const visibleFieldIds = buildVisibleFieldIds(
        formDataStored.fields,
        formDataStored.conditions,
        rawData,
        allFields,
        formDataStored.pricingDefinitions,
    );

    // Only validate visible input fields
    const visibleInputFields = allInputFields.filter(
        (f) => visibleFieldIds.has(f.id)
    );

    // Build schema from visible fields only
    const schema = buildSubmissionSchema(visibleInputFields);
    const visibleRawData: Record<string, unknown> = {};
    for (const field of visibleInputFields) {
        visibleRawData[field.name] = rawData[field.name];
    }

    const result = schema.safeParse(visibleRawData);

    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Nejsou vyplněna všechna povinná pole",
            errors,
        };
    }

    // --- Additional People validation ---
    const apFieldNames = getAPFieldNames(formDataStored.fields);
    const apInputFields = getAPInputFields(formDataStored.fields);
    let parsedAP: AdditionalPersonData[] = [];
    const apErrors: Record<number, Record<string, string[]>> = {};
    const apVisibleFieldIdsPerPerson: Set<string>[] = [];

    const rawAPJson = formData.get("__additionalPeople");
    if (rawAPJson && String(rawAPJson) !== "[]") {
        try {
            const parsed = JSON.parse(String(rawAPJson));
            if (!Array.isArray(parsed)) {
                return {
                    success: false,
                    message: "Neplatná data dalších osob",
                };
            }
            if (parsed.length > MAX_ADDITIONAL_PEOPLE) {
                return {
                    success: false,
                    message: `Maximální počet dalších osob je ${MAX_ADDITIONAL_PEOPLE}`,
                };
            }
            parsedAP = parsed;
        } catch {
            return {
                success: false,
                message: "Neplatná data dalších osob",
            };
        }

        for (let i = 0; i < parsedAP.length; i++) {
            const person = parsedAP[i];

            // Build merged data for condition evaluation
            const mergedRaw: Record<string, unknown> = {};
            for (const field of allInputFields) {
                if (apFieldNames.has(field.name)) {
                    mergedRaw[field.name] = person[field.name] ?? "";
                } else {
                    mergedRaw[field.name] = rawData[field.name];
                }
            }

            // Evaluate conditions with merged data
            const apVisibleFieldIds = buildVisibleFieldIds(
                formDataStored.fields,
                formDataStored.conditions,
                mergedRaw,
                allFields,
                formDataStored.pricingDefinitions,
            );

            apVisibleFieldIdsPerPerson.push(apVisibleFieldIds);

            // Get visible AP fields for this person
            const visibleAPFields = apInputFields.filter(
                (f) => apVisibleFieldIds.has(f.id)
            );

            // Type-convert AP values
            const typedPersonData: Record<string, unknown> = {};
            for (const field of visibleAPFields) {
                const val = person[field.name];
                if (field.type === "checkbox") {
                    typedPersonData[field.name] = val === true || val === "true";
                } else if (field.type === "number") {
                    typedPersonData[field.name] = val !== undefined && val !== "" ? Number(val) : "";
                } else {
                    typedPersonData[field.name] = val ?? "";
                }
            }

            // Validate with schema
            const apSchema = buildSubmissionSchema(visibleAPFields);
            const apResult = apSchema.safeParse(typedPersonData);

            if (!apResult.success) {
                apErrors[i] = {};
                apResult.error.issues.forEach((issue) => {
                    const path = issue.path.join(".");
                    if (!apErrors[i][path]) apErrors[i][path] = [];
                    apErrors[i][path].push(issue.message);
                });
            }

            // Store only visible AP field values
            const cleanedPerson: AdditionalPersonData = {};
            for (const field of visibleAPFields) {
                cleanedPerson[field.name] = typedPersonData[field.name] as string | number | boolean;
            }
            parsedAP[i] = cleanedPerson;
        }

        if (Object.keys(apErrors).length > 0) {
            return {
                success: false,
                message: "Nejsou vyplněna všechna povinná pole",
                errors: result.success ? undefined : undefined,
                apErrors,
            };
        }
    }

    // Build submission data (visible fields only, hidden fields stripped)
    const submissionData: Record<string, unknown> = {};
    for (const field of allInputFields) {
        if (visibleFieldIds.has(field.id)) {
            submissionData[field.name] = rawData[field.name];
        }
    }

    // Include additional people data if present
    if (parsedAP.length > 0) {
        submissionData.additionalPeople = parsedAP;
    }

    // Validate capacity limits (test registrations bypass capacity checks)
    if (!isTest && hasCapacityLimits && optionCounts) {
        const capacityError = validateCapacityLimits(
            formDataStored.capacityLimits,
            submissionData,
            parsedAP,
            allInputFields,
            formDataStored.pricingDefinitions,
            optionCounts,
        );
        if (capacityError) {
            return {
                success: false,
                message: capacityError.error,
                errors: {
                    [capacityError.fieldName]: [capacityError.error],
                },
            };
        }
    }

    // Duplicate check: find email-type field
    const emailField = allInputFields.find(
        (f): f is InputField => f.type === "email"
    );

    if (!isTest && emailField) {
        const emailValue = String(submissionData[emailField.name] || "").toLowerCase();
        if (emailValue) {
            const existing = await db.registrationSubmission.findFirst({
                where: {
                    yearId: activeYear.id,
                    data: {
                        path: [emailField.name],
                        equals: emailValue,
                    },
                },
                select: { id: true },
            });

            if (existing) {
                return {
                    success: false,
                    message: "Na tento email již existuje registrace",
                    errors: {
                        [emailField.name]: ["Na tento email již existuje registrace"],
                    },
                };
            }
        }
    }

    // Normalize email value to lowercase in submission
    if (emailField && submissionData[emailField.name]) {
        submissionData[emailField.name] = String(submissionData[emailField.name]).toLowerCase();
    }

    // Compute pricing summary and generate variable symbol
    const pricingSummary = computePricingSummary({
        pricingDefinitions: formDataStored.pricingDefinitions,
        priceTiers: formDataStored.priceTiers ?? [],
        allInputFields,
        submissionData,
        additionalPeople: parsedAP,
        visibleFieldIds,
        apVisibleFieldIdsPerPerson,
    });
    const variableSymbol = await generateUniqueVariableSymbol();
    const totalPrice = pricingSummary?.totalPrice ?? null;

    // Resolve which PublicUser (if any) this registration belongs to.
    // Test registrations link by the submitted email field so editors can
    // verify the data lands on the corresponding /ucet page. Real
    // registrations link by the current JWT session.
    let publicUserId: string | null = null;
    if (isTest) {
        const submittedEmail = emailField
            ? String(submissionData[emailField.name] ?? "").trim()
            : "";
        if (submittedEmail) {
            const matched = await db.publicUser.findUnique({
                where: { email: submittedEmail },
                select: { id: true },
            });
            publicUserId = matched?.id ?? null;
        }
    } else {
        const publicSession = await getPublicSession();
        publicUserId = publicSession?.sub ?? null;

        // Verify the public user still exists; a stale JWT cookie would
        // otherwise trigger a P2003 foreign-key violation on insert.
        if (publicUserId) {
            const exists = await db.publicUser.findUnique({
                where: { id: publicUserId },
                select: { id: true },
            });
            if (!exists) {
                publicUserId = null;
            }
        }
    }

    // GDPR consent check for anonymous users (skipped for test registrations)
    const gdprConsent = formData.get("gdprConsent") === "on";
    if (!isTest && !publicUserId && !gdprConsent) {
        return {
            success: false,
            message: "Musíte souhlasit se zpracováním osobních údajů",
            errors: { gdprConsent: ["Musíte souhlasit se zpracováním osobních údajů"] },
        };
    }

    // Create submission
    try {
        const submission = await db.registrationSubmission.create({
            data: {
                yearId: activeYear.id,
                formId: activeYear.registrationForm.id,
                data: submissionData as Prisma.InputJsonValue,
                status: "PENDING",
                pricingSummary: pricingSummary as unknown as Prisma.InputJsonValue ?? undefined,
                variableSymbol,
                totalPrice,
                publicUserId,
                gdprConsentAt: !publicUserId ? new Date() : undefined,
                isTest,
            },
        });

        // Build payment data if bank account is configured and there's a price
        const globalBank = await getGlobalBankAccount();
        let paymentData: PaymentData | undefined;
        if (totalPrice && totalPrice > 0 && globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode) {
            const iban = czechAccountToIBAN(
                globalBank.bankAccountNumber,
                globalBank.bankAccountBankCode,
                globalBank.bankAccountPrefix ?? undefined,
            );
            if (iban) {
                const spaydString = generateSPAYD({
                    iban,
                    amount: totalPrice,
                    variableSymbol,
                });
                paymentData = {
                    totalAmount: totalPrice,
                    variableSymbol,
                    bankAccount: formatCzechAccount(
                        globalBank.bankAccountNumber,
                        globalBank.bankAccountBankCode,
                        globalBank.bankAccountPrefix ?? undefined,
                    ),
                    iban,
                    swift: globalBank.bankSwift ?? null,
                    spaydString,
                };
            }
        }

        // Prepare email data (shared by confirmation and conditional emails)
        const emailField = allInputFields.find((f) => f.type === "email");
        const recipientEmail = emailField ? String(submissionData[emailField.name] ?? "") : "";

        const bankAccount = globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
            ? formatCzechAccount(
                globalBank.bankAccountNumber,
                globalBank.bankAccountBankCode,
                globalBank.bankAccountPrefix ?? undefined,
            )
            : null;

        const iban = paymentData?.iban
            ?? (globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
                ? czechAccountToIBAN(
                    globalBank.bankAccountNumber,
                    globalBank.bankAccountBankCode,
                    globalBank.bankAccountPrefix ?? undefined,
                )
                : null);

        const displaySubmissionData = resolveSubmissionDataForDisplay(
            submissionData,
            allInputFields,
            formDataStored.pricingDefinitions,
        );
        const placeholders = buildPlaceholders({
            submissionData: displaySubmissionData,
            variableSymbol,
            totalPrice,
            bankAccount,
            iban,
            swift: globalBank?.bankSwift ?? null,
            yearNumber: activeYear.year,
            yearTitle: activeYear.title,
            yearSubtitle: activeYear.subtitle,
        });

        // Generate QR payment image if payment data is available
        let qrImageBuffer: Buffer | null = null;
        if (paymentData) {
            qrImageBuffer = await generateQRPaymentImage({
                iban: paymentData.iban,
                amount: paymentData.totalAmount,
                variableSymbol: paymentData.variableSymbol,
            });
        }

        // Send confirmation email if enabled (non-blocking).
        // Test registrations never send emails.
        if (
            !isTest &&
            activeYear.confirmationEmailEnabled &&
            activeYear.confirmationEmailSubject &&
            activeYear.confirmationEmailBody &&
            recipientEmail
        ) {
            try {
                const emailSubject = replacePlaceholders(activeYear.confirmationEmailSubject, placeholders);
                const bodyWithSections = appendConditionalSections({
                    body: activeYear.confirmationEmailBody,
                    sections: (activeYear.confirmationEmailSections as unknown as EmailConditionalSection[]) ?? [],
                    rawSubmissionData: submissionData,
                    allFields,
                    pricingDefinitions: formDataStored.pricingDefinitions,
                });
                const emailBody = replacePlaceholders(bodyWithSections, placeholders);

                const sectionAttachments = collectMatchingSectionAttachments({
                    sections: (activeYear.confirmationEmailSections as unknown as EmailConditionalSection[]) ?? [],
                    rawSubmissionData: submissionData,
                    allFields,
                    pricingDefinitions: formDataStored.pricingDefinitions,
                });

                const sent = await sendConfirmationEmail({
                    to: recipientEmail,
                    subject: emailSubject,
                    body: emailBody,
                    bcc: activeYear.confirmationEmailBcc ?? undefined,
                    qrImageBuffer: qrImageBuffer ?? undefined,
                    accountId: activeYear.confirmationEmailAccountId,
                    attachments: [
                        ...((activeYear.confirmationEmailAttachments as unknown as { filename: string; url: string }[]) ?? []),
                        ...sectionAttachments,
                    ],
                });

                if (sent) {
                    await db.registrationSubmission.update({
                        where: { id: submission.id },
                        data: { emailSent: true, emailSentAt: new Date() },
                    });
                }
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Email failure does NOT block registration
            }
        }

        // Send conditional emails (non-blocking).
        // Test registrations never send emails.
        if (!isTest && recipientEmail) {
            try {
                const conditionalEmails = await db.conditionalEmail.findMany({
                    where: { yearId: activeYear.id, enabled: true },
                    select: {
                        id: true,
                        name: true,
                        conditionFieldId: true,
                        conditionOperator: true,
                        conditionValue: true,
                        subject: true,
                        body: true,
                        bcc: true,
                        accountId: true,
                        sections: true,
                        attachments: true,
                    },
                });

                for (const ce of conditionalEmails) {
                    if (!ce.subject || !ce.body) continue;

                    const synth: FormCondition = {
                        id: ce.id,
                        name: ce.name,
                        rules: [{
                            type: "field_value",
                            fieldId: ce.conditionFieldId,
                            operator: ce.conditionOperator as ConditionRule["operator"],
                            value: ce.conditionValue ?? "",
                        }],
                    };
                    if (!evaluateCondition(synth, submissionData, allFields, formDataStored.pricingDefinitions)) continue;

                    const ceSubject = replacePlaceholders(ce.subject, placeholders);
                    const ceBodyWithSections = appendConditionalSections({
                        body: ce.body,
                        sections: (ce.sections as unknown as EmailConditionalSection[]) ?? [],
                        rawSubmissionData: submissionData,
                        allFields,
                        pricingDefinitions: formDataStored.pricingDefinitions,
                    });
                    const ceBody = replacePlaceholders(ceBodyWithSections, placeholders);

                    const ceSectionAttachments = collectMatchingSectionAttachments({
                        sections: (ce.sections as unknown as EmailConditionalSection[]) ?? [],
                        rawSubmissionData: submissionData,
                        allFields,
                        pricingDefinitions: formDataStored.pricingDefinitions,
                    });

                    await sendConfirmationEmail({
                        to: recipientEmail,
                        subject: ceSubject,
                        body: ceBody,
                        bcc: ce.bcc ?? undefined,
                        qrImageBuffer: qrImageBuffer ?? undefined,
                        accountId: ce.accountId,
                        attachments: [
                            ...((ce.attachments as unknown as { filename: string; url: string }[]) ?? []),
                            ...ceSectionAttachments,
                        ],
                    });
                }
            } catch (condEmailError) {
                console.error("Failed to send conditional emails:", condEmailError);
                // Conditional email failure does NOT block registration
            }
        }

        return {
            success: true,
            message: isTest
                ? `Testovací registrace na ${activeYear.title} byla uložena. Emaily nebyly odeslány.`
                : `Děkujeme za registraci na ${activeYear.title}!`,
            registrationId: submission.id,
            variableSymbol,
            totalPrice: totalPrice ?? undefined,
            paymentData,
        };
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            message: "Nastala chyba při zpracování registrace. Zkuste to prosím znovu.",
        };
    }
}
