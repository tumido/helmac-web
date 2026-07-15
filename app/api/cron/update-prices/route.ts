import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
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
import type { EmailConditionalSection } from "@/lib/types/email-sections";
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

interface V2OrderForPriceUpdate {
    id: string;
    yearId: string;
    totalPrice: number | null;
    variableSymbol: string | null;
    legacySubmissionId: string | null;
}

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    // Query unpaid v2 orders with priced line items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: V2OrderForPriceUpdate[] = await (db as any).v2Order.findMany({
        where: {
            isPaid: false,
            isTest: false,
            status: { notIn: ["CANCELLED", "REJECTED"] },
            parentOrderId: null,
            orderType: "registration",
        },
        select: {
            id: true,
            yearId: true,
            totalPrice: true,
            variableSymbol: true,
            legacySubmissionId: true,
        },
    });

    const globalBank = await getGlobalBankAccount();

    let updated = 0;
    let skipped = 0;
    let emailsSent = 0;
    const errors: string[] = [];
    const emailErrors: string[] = [];

    for (const order of orders) {
        try {
            // Compute current total via v2 DB function
            const totalRows = await db.$queryRaw<
                { v2_compute_current_total: number }[]
            >(
                Prisma.sql`SELECT v2_compute_current_total(${order.id}) AS v2_compute_current_total`,
            );
            const newTotal = totalRows[0]?.v2_compute_current_total ?? 0;

            if (newTotal === order.totalPrice) {
                skipped++;
                continue;
            }

            const oldPrice = order.totalPrice;

            // Update both v2 order and legacy submission
            await db.$transaction(async (tx) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (tx as any).v2Order.update({
                    where: { id: order.id },
                    data: { totalPrice: newTotal },
                });
                if (order.legacySubmissionId) {
                    await tx.registrationSubmission.update({
                        where: { id: order.legacySubmissionId },
                        data: { totalPrice: newTotal },
                    });
                }
            });
            updated++;

            // Send price change email
            const year = await db.year.findUnique({
                where: { id: order.yearId },
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
                    priceChangeEmailAttachments: true,
                },
            });

            if (
                !year?.priceChangeEmailEnabled ||
                !year.priceChangeEmailSubject ||
                !year.priceChangeEmailBody
            )
                continue;

            try {
                // Get submission data for email placeholders
                // (still uses legacy data blob for placeholder resolution)
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

                const emailSubject = replacePlaceholders(
                    year.priceChangeEmailSubject,
                    placeholders,
                );
                const bodyWithSections = appendConditionalSections({
                    body: year.priceChangeEmailBody,
                    sections:
                        (year.priceChangeEmailSections as unknown as EmailConditionalSection[]) ??
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
                        sections:
                            (year.priceChangeEmailSections as unknown as EmailConditionalSection[]) ??
                            [],
                        rawSubmissionData: submissionData,
                        allFields: cachedForm.fields,
                        pricingDefinitions:
                            cachedForm.pricingDefinitions,
                    });

                const sent = await sendConfirmationEmail({
                    to: recipientEmail,
                    subject: emailSubject,
                    body: emailBody,
                    bcc: year.priceChangeEmailBcc ?? undefined,
                    qrImageBuffer: qrImageBuffer ?? undefined,
                    accountId: year.priceChangeEmailAccountId,
                    attachments: [
                        ...((year.priceChangeEmailAttachments as unknown as {
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
