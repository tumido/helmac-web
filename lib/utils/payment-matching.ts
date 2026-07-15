import { Prisma, BankTransactionMatchStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
    buildPlaceholders,
    replacePlaceholders,
    sendConfirmationEmail,
    appendConditionalSections,
    collectMatchingSectionAttachments,
} from "@/lib/utils/email";
import { czechAccountToIBAN, formatCzechAccount } from "@/lib/utils/spayd";
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
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import type { ParsedBankTransaction } from "@/lib/utils/fio-api";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";
import { syncOrderScalarToV2 } from "@/lib/utils/v2-dual-write";

export interface MatchResult {
    total: number;
    matched: number;
    partial: number;
    overpayment: number;
    noVs: number;
    unknownVs: number;
    alreadyPaid: number;
    outgoing: number;
    duplicates: number;
    emailsSent: number;
    errors: string[];
}

export async function processTransactions(
    transactions: ParsedBankTransaction[],
): Promise<MatchResult> {
    const result: MatchResult = {
        total: transactions.length,
        matched: 0,
        partial: 0,
        overpayment: 0,
        noVs: 0,
        unknownVs: 0,
        alreadyPaid: 0,
        outgoing: 0,
        duplicates: 0,
        emailsSent: 0,
        errors: [],
    };

    const bankAccount = await getGlobalBankAccount();

    for (const tx of transactions) {
        try {
            if (tx.amount <= 0) {
                await createBankTransaction(
                    null,
                    tx,
                    BankTransactionMatchStatus.OUTGOING,
                );
                result.outgoing++;
                continue;
            }

            if (!tx.variableSymbol) {
                await createBankTransaction(
                    null,
                    tx,
                    BankTransactionMatchStatus.NO_VARIABLE_SYMBOL,
                );
                result.noVs++;
                continue;
            }

            // Look up v2 order by variable symbol
            const order = await db.v2Order.findFirst({
                where: {
                    variableSymbol: tx.variableSymbol,
                    isTest: false,
                },
                select: {
                    id: true,
                    yearId: true,
                    isPaid: true,
                    totalPrice: true,
                    legacySubmissionId: true,
                    year: {
                        select: {
                            year: true,
                            title: true,
                            subtitle: true,
                            paymentEmailEnabled: true,
                            paymentEmailSubject: true,
                            paymentEmailBody: true,
                            paymentEmailBcc: true,
                            paymentEmailAccountId: true,
                            paymentEmailSections: true,
                            paymentEmailAttachments: true,
                        },
                    },
                },
            });

            if (!order) {
                await createBankTransaction(
                    null,
                    tx,
                    BankTransactionMatchStatus.UNKNOWN_VS,
                );
                result.unknownVs++;
                continue;
            }

            if (order.isPaid) {
                await createBankTransaction(
                    order.yearId,
                    tx,
                    BankTransactionMatchStatus.ALREADY_PAID,
                    order.legacySubmissionId,
                    order.id,
                );
                result.alreadyPaid++;
                continue;
            }

            const totalPrice = order.totalPrice ?? 0;

            if (tx.amount < totalPrice) {
                const dateStr = tx.date.toLocaleDateString("cs-CZ");
                const note = `Částečná platba: ${tx.amount} Kč z ${totalPrice} Kč (${dateStr})`;

                if (order.legacySubmissionId) {
                    const sub =
                        await db.registrationSubmission.findUnique({
                            where: { id: order.legacySubmissionId },
                            select: { adminNote: true },
                        });
                    const existingNote = sub?.adminNote ?? "";
                    const updatedNote = existingNote
                        ? `${existingNote}\n${note}`
                        : note;

                    await db.$transaction(async (txn) => {
                        await txn.registrationSubmission.update({
                            where: {
                                id: order.legacySubmissionId!,
                            },
                            data: { adminNote: updatedNote },
                        });
                        await syncOrderScalarToV2(
                            txn,
                            order.legacySubmissionId!,
                            { adminNote: updatedNote },
                        );
                    });
                }

                await createBankTransaction(
                    order.yearId,
                    tx,
                    BankTransactionMatchStatus.PARTIAL_PAYMENT,
                    order.legacySubmissionId,
                    order.id,
                );
                result.partial++;
                continue;
            }

            // Full match or overpayment
            const matchStatus =
                tx.amount > totalPrice
                    ? BankTransactionMatchStatus.OVERPAYMENT
                    : BankTransactionMatchStatus.MATCHED;

            await db.$transaction(async (txn) => {
                if (order.legacySubmissionId) {
                    await txn.registrationSubmission.update({
                        where: {
                            id: order.legacySubmissionId,
                        },
                        data: {
                            isPaid: true,
                            paidAt: tx.date,
                        },
                    });
                    await syncOrderScalarToV2(
                        txn,
                        order.legacySubmissionId,
                        { isPaid: true, paidAt: tx.date },
                    );
                }
            });

            await createBankTransaction(
                order.yearId,
                tx,
                matchStatus,
                order.legacySubmissionId,
                order.id,
            );

            if (
                matchStatus ===
                BankTransactionMatchStatus.OVERPAYMENT
            ) {
                result.overpayment++;
            } else {
                result.matched++;
            }

            // Send payment confirmation email
            const { year } = order;
            if (
                year.paymentEmailEnabled &&
                year.paymentEmailSubject &&
                year.paymentEmailBody
            ) {
                try {
                    await sendPaymentEmail(
                        order,
                        tx,
                        {
                            ...year,
                            paymentEmailSubject: year.paymentEmailSubject!,
                            paymentEmailBody: year.paymentEmailBody!,
                        },
                        totalPrice,
                        bankAccount,
                        result,
                    );
                } catch (emailError) {
                    result.errors.push(
                        `Email for tx ${tx.fioTransactionId}: ${emailError instanceof Error ? emailError.message : "Unknown"}`,
                    );
                }
            }
        } catch (error) {
            if (
                error instanceof
                    Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                result.duplicates++;
                continue;
            }
            result.errors.push(
                `tx ${tx.fioTransactionId}: ${error instanceof Error ? error.message : "Unknown"}`,
            );
        }
    }

    return result;
}

// ---- Email sending (still uses legacy submission data for placeholders) ----

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

async function sendPaymentEmail(
    order: {
        id: string;
        legacySubmissionId: string | null;
        yearId: string;
    },
    tx: ParsedBankTransaction,
    year: {
        year: number;
        title: string;
        subtitle: string | null;
        paymentEmailSubject: string;
        paymentEmailBody: string;
        paymentEmailBcc: string | null;
        paymentEmailAccountId: string | null;
        paymentEmailSections: unknown;
        paymentEmailAttachments: unknown;
    },
    totalPrice: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bankAccount: any,
    result: MatchResult,
): Promise<void> {
    if (!order.legacySubmissionId) return;

    const submission =
        await db.registrationSubmission.findUnique({
            where: { id: order.legacySubmissionId },
            select: { data: true, formId: true },
        });
    if (!submission) return;

    const cachedForm = await getFormFields(
        submission.formId,
    );
    const { fields, inputFields, pricingDefinitions } =
        cachedForm;
    const emailField = fields.find(
        (f) => isInputField(f) && f.type === "email",
    );
    const submissionData = submission.data as Record<
        string,
        unknown
    >;
    const recipientEmail =
        emailField && isInputField(emailField)
            ? String(
                  submissionData[emailField.name] ?? "",
              )
            : "";

    if (!recipientEmail) return;

    const bankAccountFormatted =
        bankAccount?.bankAccountNumber &&
        bankAccount?.bankAccountBankCode
            ? formatCzechAccount(
                  bankAccount.bankAccountNumber,
                  bankAccount.bankAccountBankCode,
                  bankAccount.bankAccountPrefix ??
                      undefined,
              )
            : null;
    const iban =
        bankAccount?.bankAccountNumber &&
        bankAccount?.bankAccountBankCode
            ? czechAccountToIBAN(
                  bankAccount.bankAccountNumber,
                  bankAccount.bankAccountBankCode,
                  bankAccount.bankAccountPrefix ??
                      undefined,
              )
            : null;

    const displayData = resolveSubmissionDataForDisplay(
        submissionData,
        inputFields,
        pricingDefinitions,
    );
    const placeholders = buildPlaceholders({
        submissionData: displayData,
        variableSymbol: tx.variableSymbol,
        totalPrice,
        bankAccount: bankAccountFormatted,
        iban,
        swift: bankAccount?.bankSwift ?? null,
        yearNumber: year.year,
        yearTitle: year.title,
        yearSubtitle: year.subtitle,
    });
    placeholders.prijataCastka = `${tx.amount} Kč`;

    const emailSubject = replacePlaceholders(
        year.paymentEmailSubject,
        placeholders,
    );
    const bodyWithSections = appendConditionalSections({
        body: year.paymentEmailBody,
        sections:
            (year.paymentEmailSections as unknown as EmailConditionalSection[]) ??
            [],
        rawSubmissionData: submissionData,
        allFields: fields,
        pricingDefinitions,
    });
    const emailBody = replacePlaceholders(
        bodyWithSections,
        placeholders,
    );

    const sectionAttachments =
        collectMatchingSectionAttachments({
            sections:
                (year.paymentEmailSections as unknown as EmailConditionalSection[]) ??
                [],
            rawSubmissionData: submissionData,
            allFields: fields,
            pricingDefinitions,
        });

    const sent = await sendConfirmationEmail({
        to: recipientEmail,
        subject: emailSubject,
        body: emailBody,
        bcc: year.paymentEmailBcc ?? undefined,
        accountId: year.paymentEmailAccountId,
        attachments: [
            ...((year.paymentEmailAttachments as unknown as {
                filename: string;
                url: string;
            }[]) ?? []),
            ...sectionAttachments,
        ],
    });

    if (sent) {
        result.emailsSent++;
    }
}

// ---- Bank transaction creation ----

async function createBankTransaction(
    yearId: string | null,
    tx: ParsedBankTransaction,
    matchStatus: BankTransactionMatchStatus,
    submissionId?: string | null,
    orderId?: string,
) {
    await db.bankTransaction.create({
        data: {
            yearId,
            fioTransactionId: tx.fioTransactionId,
            date: tx.date,
            amount: tx.amount,
            currency: tx.currency,
            variableSymbol: tx.variableSymbol,
            counterpartAccount: tx.counterpartAccount,
            counterpartName: tx.counterpartName,
            userMessage: tx.userMessage,
            matchStatus,
            submissionId: submissionId ?? null,
            orderId: orderId ?? null,
            processedAt: new Date(),
        },
    });
}
