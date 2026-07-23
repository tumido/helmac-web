import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    getUnpaidOrders,
    computeCurrentTotal,
    updateOrderTotalPrice,
    getEmailTemplate,
    getFieldIdToLegacyIdMap,
    v2SectionsToLegacy,
} from "@/lib/services/v2";
import {
    buildPlaceholders,
    replacePlaceholders,
    generateQRPaymentImage,
    sendConfirmationEmail,
    appendConditionalSections,
    collectMatchingSectionAttachments,
} from "@/lib/utils/email";
import { czechAccountToIBAN, formatCzechAccount } from "@/lib/utils/spayd";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { migrateFormData } from "@/lib/utils/form-migration";
import {
    getAllFields,
    getAllInputFields,
    isInputField,
} from "@/lib/types/registration-form";
import type {
    FormField,
    InputField,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    const orders = await getUnpaidOrders();

    const globalBank = await getGlobalBankAccount();

    let updated = 0;
    let skipped = 0;
    let emailsSent = 0;
    const errors: string[] = [];
    const emailErrors: string[] = [];

    const templateCache = new Map<string, Awaited<ReturnType<typeof getEmailTemplate>>>();
    const fieldIdMapCache = new Map<string, Map<string, string>>();
    const yearCache = new Map<string, { year: number; title: string; subtitle: string | null } | null>();

    for (const order of orders) {
        try {
            const newTotal = await computeCurrentTotal(order.id);

            if (newTotal === order.totalPrice) {
                skipped++;
                continue;
            }

            const oldPrice = order.totalPrice;

            await updateOrderTotalPrice(
                order.id,
                order.legacySubmissionId,
                newTotal,
            );
            updated++;

            // Send price change email
            if (!templateCache.has(order.yearId)) {
                templateCache.set(order.yearId, await getEmailTemplate(order.yearId, "price_change"));
            }
            const template = templateCache.get(order.yearId)!;
            if (
                !template?.enabled ||
                !template.subject ||
                !template.body
            )
                continue;

            if (!yearCache.has(order.yearId)) {
                yearCache.set(order.yearId, await db.year.findUnique({
                    where: { id: order.yearId },
                    select: { year: true, title: true, subtitle: true },
                }));
            }
            const year = yearCache.get(order.yearId);
            if (!year) continue;

            try {
                if (!order.legacySubmissionId) continue;
                const submission =
                    await db.registrationSubmission.findUnique({
                        where: { id: order.legacySubmissionId },
                        select: {
                            data: true,
                            formId: true,
                            variableSymbol: true,
                        },
                    });
                if (!submission) continue;

                const cachedForm = await getFormFields(
                    submission.formId,
                );
                const submissionData = submission.data as Record<
                    string,
                    unknown
                >;
                const emailField = cachedForm.fields.find(
                    (f) => isInputField(f) && f.type === "email",
                );
                const recipientEmail =
                    emailField && isInputField(emailField)
                        ? String(
                              submissionData[emailField.name] ?? "",
                          )
                        : "";

                if (!recipientEmail) continue;

                const bankAccountFormatted =
                    globalBank?.bankAccountNumber &&
                    globalBank?.bankAccountBankCode
                        ? formatCzechAccount(
                              globalBank.bankAccountNumber,
                              globalBank.bankAccountBankCode,
                              globalBank.bankAccountPrefix ??
                                  undefined,
                          )
                        : null;
                const iban =
                    globalBank?.bankAccountNumber &&
                    globalBank?.bankAccountBankCode
                        ? czechAccountToIBAN(
                              globalBank.bankAccountNumber,
                              globalBank.bankAccountBankCode,
                              globalBank.bankAccountPrefix ??
                                  undefined,
                          )
                        : null;

                const displayData = resolveSubmissionDataForDisplay(
                    submissionData,
                    cachedForm.inputFields,
                    cachedForm.pricingDefinitions,
                );
                const placeholders = buildPlaceholders({
                    submissionData: displayData,
                    variableSymbol: order.variableSymbol,
                    totalPrice: newTotal,
                    bankAccount: bankAccountFormatted,
                    iban,
                    swift: globalBank?.bankSwift ?? null,
                    yearNumber: year.year,
                    yearTitle: year.title,
                    yearSubtitle: year.subtitle,
                });
                placeholders.staraCena =
                    oldPrice != null ? `${oldPrice} Kč` : "";
                placeholders.novaCena = `${newTotal} Kč`;

                if (!fieldIdMapCache.has(order.yearId)) {
                    fieldIdMapCache.set(order.yearId, await getFieldIdToLegacyIdMap(order.yearId));
                }
                const fieldIdMap = fieldIdMapCache.get(order.yearId)!;
                const legacySections = v2SectionsToLegacy(template.sections, fieldIdMap);

                const emailSubject = replacePlaceholders(
                    template.subject!,
                    placeholders,
                );
                const bodyWithSections = appendConditionalSections({
                    body: template.body!,
                    sections: legacySections ??
                        [],
                    rawSubmissionData: submissionData,
                    allFields: cachedForm.fields,
                    pricingDefinitions: cachedForm.pricingDefinitions,
                });
                const emailBody = replacePlaceholders(
                    bodyWithSections,
                    placeholders,
                );

                let qrImageBuffer: Buffer | null = null;
                if (newTotal > 0 && iban) {
                    qrImageBuffer = await generateQRPaymentImage({
                        iban,
                        amount: newTotal,
                        variableSymbol: order.variableSymbol ?? undefined,
                    });
                }

                const sectionAttachments =
                    collectMatchingSectionAttachments({
                        sections: legacySections ?? [],
                        rawSubmissionData: submissionData,
                        allFields: cachedForm.fields,
                        pricingDefinitions:
                            cachedForm.pricingDefinitions,
                    });

                const sent = await sendConfirmationEmail({
                    to: recipientEmail,
                    subject: emailSubject,
                    body: emailBody,
                    bcc: template.bcc ?? undefined,
                    qrImageBuffer: qrImageBuffer ?? undefined,
                    accountId: template.accountId,
                    attachments: [
                        ...((template.attachments as {
                            filename: string;
                            url: string;
                        }[]) ?? []),
                        ...sectionAttachments,
                    ],
                });

                if (sent) {
                    emailsSent++;
                } else {
                    emailErrors.push(
                        `${order.id}: Email send failed`,
                    );
                }
            } catch (emailError) {
                emailErrors.push(
                    `${order.id}: ${emailError instanceof Error ? emailError.message : "Unknown email error"}`,
                );
            }
        } catch (error) {
            errors.push(
                `${order.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    }

    return NextResponse.json({
        success: true,
        processed: orders.length,
        updated,
        skipped,
        emailsSent,
        errors,
        emailErrors,
        timestamp: new Date().toISOString(),
    });
}

// Cache form fields per formId within a single cron run
interface CachedForm {
    fields: FormField[];
    inputFields: InputField[];
    pricingDefinitions: PricingDefinition[];
}
const formFieldsCache = new Map<string, CachedForm>();

async function getFormFields(
    formId: string,
): Promise<CachedForm> {
    const cached = formFieldsCache.get(formId);
    if (cached) return cached;
    const form = await db.registrationForm.findUnique({
        where: { id: formId },
        select: { fields: true },
    });
    if (!form) {
        const empty: CachedForm = {
            fields: [],
            inputFields: [],
            pricingDefinitions: [],
        };
        formFieldsCache.set(formId, empty);
        return empty;
    }
    const formData = migrateFormData(form.fields);
    const value: CachedForm = {
        fields: getAllFields(formData.fields),
        inputFields: getAllInputFields(formData.fields),
        pricingDefinitions: formData.pricingDefinitions,
    };
    formFieldsCache.set(formId, value);
    return value;
}
