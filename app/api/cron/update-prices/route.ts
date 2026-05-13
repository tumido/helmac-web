import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getApplicablePriceFromSummary } from "@/lib/utils/pricing";
import { buildPlaceholders, replacePlaceholders, generateQRPaymentImage, sendConfirmationEmail, appendConditionalSections } from "@/lib/utils/email";
import { czechAccountToIBAN, formatCzechAccount } from "@/lib/utils/spayd";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllFields, getAllInputFields, isInputField } from "@/lib/types/registration-form";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import type { FormField, InputField, PricingDefinition, PricingSummaryData } from "@/lib/types/registration-form";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await db.registrationSubmission.findMany({
        where: {
            isPaid: false,
            pricingSummary: { not: Prisma.DbNull },
            status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        select: {
            id: true,
            totalPrice: true,
            pricingSummary: true,
            yearId: true,
            formId: true,
            data: true,
            variableSymbol: true,
            year: {
                select: {
                    year: true,
                    title: true,
                    subtitle: true,
                    priceChangeEmailEnabled: true,
                    priceChangeEmailSubject: true,
                    priceChangeEmailBody: true,
                    priceChangeEmailBcc: true,
                    priceChangeEmailAccountId: true,
                    priceChangeEmailSections: true,
                },
            },
        },
    });

    const globalBank = await getGlobalBankAccount();

    let updated = 0;
    let skipped = 0;
    let emailsSent = 0;
    const errors: string[] = [];
    const emailErrors: string[] = [];

    // Cache form fields per formId to avoid repeated DB lookups
    interface CachedForm {
        fields: FormField[];
        inputFields: InputField[];
        pricingDefinitions: PricingDefinition[];
    }
    const formFieldsCache = new Map<string, CachedForm>();

    async function getFormInputFields(formId: string): Promise<CachedForm> {
        const cached = formFieldsCache.get(formId);
        if (cached) return cached;
        const form = await db.registrationForm.findUnique({
            where: { id: formId },
            select: { fields: true },
        });
        if (!form) {
            const empty: CachedForm = { fields: [], inputFields: [], pricingDefinitions: [] };
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

    for (const submission of submissions) {
        try {
            const summary = submission.pricingSummary as unknown as PricingSummaryData;
            const { totalPrice, applicableTierIndex } = getApplicablePriceFromSummary(summary);

            if (totalPrice === submission.totalPrice) {
                skipped++;
                continue;
            }

            const oldPrice = submission.totalPrice;

            await db.registrationSubmission.update({
                where: { id: submission.id },
                data: {
                    totalPrice,
                    pricingSummary: {
                        ...summary,
                        applicableTierIndex,
                        totalPrice,
                    } as unknown as Prisma.InputJsonValue,
                },
            });
            updated++;

            // Send price change email if enabled
            const { year } = submission;
            if (
                year.priceChangeEmailEnabled &&
                year.priceChangeEmailSubject &&
                year.priceChangeEmailBody
            ) {
                try {
                    const cachedForm = await getFormInputFields(submission.formId);
                    const { fields: allFormFields, inputFields, pricingDefinitions } = cachedForm;
                    const emailField = allFormFields.find((f) => isInputField(f) && f.type === "email");
                    const submissionData = submission.data as Record<string, unknown>;
                    const recipientEmail = emailField && isInputField(emailField)
                        ? String(submissionData[emailField.name] ?? "")
                        : "";

                    if (recipientEmail) {
                        const bankAccountFormatted = globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
                            ? formatCzechAccount(
                                globalBank.bankAccountNumber,
                                globalBank.bankAccountBankCode,
                                globalBank.bankAccountPrefix ?? undefined,
                            )
                            : null;

                        const displaySubmissionData = resolveSubmissionDataForDisplay(
                            submissionData,
                            inputFields,
                            pricingDefinitions,
                        );
                        const placeholders = buildPlaceholders({
                            submissionData: displaySubmissionData,
                            variableSymbol: submission.variableSymbol,
                            totalPrice,
                            bankAccount: bankAccountFormatted,
                            yearNumber: year.year,
                            yearTitle: year.title,
                            yearSubtitle: year.subtitle,
                        });

                        // Add price change specific placeholders
                        placeholders.staraCena = oldPrice != null ? `${oldPrice} Kč` : "";
                        placeholders.novaCena = `${totalPrice} Kč`;

                        const emailSubject = replacePlaceholders(year.priceChangeEmailSubject, placeholders);
                        const bodyWithSections = appendConditionalSections({
                            body: year.priceChangeEmailBody,
                            sections: (year.priceChangeEmailSections as unknown as EmailConditionalSection[]) ?? [],
                            rawSubmissionData: submissionData,
                            allFields: allFormFields,
                            pricingDefinitions,
                        });
                        const emailBody = replacePlaceholders(bodyWithSections, placeholders);

                        // Generate QR payment image if bank account is configured
                        let qrImageBuffer: Buffer | null = null;
                        if (globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode && totalPrice > 0) {
                            const iban = czechAccountToIBAN(
                                globalBank.bankAccountNumber,
                                globalBank.bankAccountBankCode,
                                globalBank.bankAccountPrefix ?? undefined,
                            );
                            if (iban) {
                                qrImageBuffer = await generateQRPaymentImage({
                                    iban,
                                    amount: totalPrice,
                                    variableSymbol: submission.variableSymbol ?? undefined,
                                });
                            }
                        }

                        const sent = await sendConfirmationEmail({
                            to: recipientEmail,
                            subject: emailSubject,
                            body: emailBody,
                            bcc: year.priceChangeEmailBcc ?? undefined,
                            qrImageBuffer: qrImageBuffer ?? undefined,
                            accountId: year.priceChangeEmailAccountId,
                        });

                        if (sent) {
                            emailsSent++;
                        } else {
                            emailErrors.push(`${submission.id}: Email send failed`);
                        }
                    }
                } catch (emailError) {
                    emailErrors.push(`${submission.id}: ${emailError instanceof Error ? emailError.message : "Unknown email error"}`);
                }
            }
        } catch (error) {
            errors.push(`${submission.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    return NextResponse.json({
        success: true,
        processed: submissions.length,
        updated,
        skipped,
        emailsSent,
        errors,
        emailErrors,
        timestamp: new Date().toISOString(),
    });
}
