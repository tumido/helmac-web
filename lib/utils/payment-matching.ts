import { Prisma, BankTransactionMatchStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { buildPlaceholders, replacePlaceholders, sendConfirmationEmail, appendConditionalSections } from "@/lib/utils/email";
import { formatCzechAccount } from "@/lib/utils/spayd";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllFields, isInputField } from "@/lib/types/registration-form";
import type { FormField } from "@/lib/types/registration-form";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import type { ParsedBankTransaction } from "@/lib/utils/fio-api";
import type { EmailConditionalSection } from "@/lib/types/email-sections";

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

    // Fetch global bank account for email placeholders
    const bankAccount = await getGlobalBankAccount();

    // Cache form fields per formId for email placeholders and section conditions
    const formFieldsCache = new Map<string, FormField[]>();

    async function getFormFields(formId: string): Promise<FormField[]> {
        if (formFieldsCache.has(formId)) return formFieldsCache.get(formId)!;
        const form = await db.registrationForm.findUnique({
            where: { id: formId },
            select: { fields: true },
        });
        if (!form) {
            formFieldsCache.set(formId, []);
            return [];
        }
        const formData = migrateFormData(form.fields);
        const fields = getAllFields(formData.fields);
        formFieldsCache.set(formId, fields);
        return fields;
    }

    for (const tx of transactions) {
        try {
            // 1. Skip outgoing transactions
            if (tx.amount <= 0) {
                await createBankTransaction(null, tx, BankTransactionMatchStatus.OUTGOING);
                result.outgoing++;
                continue;
            }

            // 2. No variable symbol
            if (!tx.variableSymbol) {
                await createBankTransaction(null, tx, BankTransactionMatchStatus.NO_VARIABLE_SYMBOL);
                result.noVs++;
                continue;
            }

            // 3. Lookup submission by VS (cross-year, VS is @unique)
            const submission = await db.registrationSubmission.findFirst({
                where: {
                    variableSymbol: tx.variableSymbol,
                },
                select: {
                    id: true,
                    isPaid: true,
                    totalPrice: true,
                    data: true,
                    formId: true,
                    adminNote: true,
                    yearId: true,
                    year: {
                        select: {
                            id: true,
                            year: true,
                            title: true,
                            subtitle: true,
                            paymentEmailEnabled: true,
                            paymentEmailSubject: true,
                            paymentEmailBody: true,
                            paymentEmailBcc: true,
                            paymentEmailAccountId: true,
                            paymentEmailSections: true,
                        },
                    },
                },
            });

            // 4. Unknown VS
            if (!submission) {
                await createBankTransaction(null, tx, BankTransactionMatchStatus.UNKNOWN_VS);
                result.unknownVs++;
                continue;
            }

            // 5. Already paid
            if (submission.isPaid) {
                await createBankTransaction(submission.yearId, tx, BankTransactionMatchStatus.ALREADY_PAID, submission.id);
                result.alreadyPaid++;
                continue;
            }

            const totalPrice = submission.totalPrice ?? 0;

            // 6. Partial payment
            if (tx.amount < totalPrice) {
                const dateStr = tx.date.toLocaleDateString("cs-CZ");
                const note = `Částečná platba: ${tx.amount} Kč z ${totalPrice} Kč (${dateStr})`;
                const existingNote = submission.adminNote ?? "";
                const updatedNote = existingNote ? `${existingNote}\n${note}` : note;

                await db.registrationSubmission.update({
                    where: { id: submission.id },
                    data: { adminNote: updatedNote },
                });

                await createBankTransaction(submission.yearId, tx, BankTransactionMatchStatus.PARTIAL_PAYMENT, submission.id);
                result.partial++;
                continue;
            }

            // 7. Full match or overpayment
            const matchStatus = tx.amount > totalPrice
                ? BankTransactionMatchStatus.OVERPAYMENT
                : BankTransactionMatchStatus.MATCHED;

            await db.registrationSubmission.update({
                where: { id: submission.id },
                data: {
                    isPaid: true,
                    paidAt: tx.date,
                },
            });

            await createBankTransaction(submission.yearId, tx, matchStatus, submission.id);

            if (matchStatus === BankTransactionMatchStatus.OVERPAYMENT) {
                result.overpayment++;
            } else {
                result.matched++;
            }

            // 8. Send payment confirmation email
            const { year } = submission;
            if (
                year.paymentEmailEnabled &&
                year.paymentEmailSubject &&
                year.paymentEmailBody
            ) {
                try {
                    const fields = await getFormFields(submission.formId);
                    const emailField = fields.find((f) => isInputField(f) && f.type === "email");
                    const submissionData = submission.data as Record<string, unknown>;
                    const recipientEmail = emailField && isInputField(emailField)
                        ? String(submissionData[emailField.name] ?? "")
                        : "";

                    if (recipientEmail) {
                        const bankAccountFormatted = bankAccount?.bankAccountNumber && bankAccount?.bankAccountBankCode
                            ? formatCzechAccount(
                                bankAccount.bankAccountNumber,
                                bankAccount.bankAccountBankCode,
                                bankAccount.bankAccountPrefix ?? undefined,
                            )
                            : null;

                        const placeholders = buildPlaceholders({
                            submissionData,
                            variableSymbol: tx.variableSymbol,
                            totalPrice,
                            bankAccount: bankAccountFormatted,
                            yearNumber: year.year,
                            yearTitle: year.title,
                            yearSubtitle: year.subtitle,
                        });

                        placeholders.prijataCastka = `${tx.amount} Kč`;

                        const emailSubject = replacePlaceholders(year.paymentEmailSubject, placeholders);
                        const bodyWithSections = appendConditionalSections({
                            body: year.paymentEmailBody,
                            sections: (year.paymentEmailSections as unknown as EmailConditionalSection[]) ?? [],
                            rawSubmissionData: submissionData,
                            allFields: fields,
                        });
                        const emailBody = replacePlaceholders(bodyWithSections, placeholders);

                        const sent = await sendConfirmationEmail({
                            to: recipientEmail,
                            subject: emailSubject,
                            body: emailBody,
                            bcc: year.paymentEmailBcc ?? undefined,
                            accountId: year.paymentEmailAccountId,
                        });

                        if (sent) {
                            result.emailsSent++;
                        }
                    }
                } catch (emailError) {
                    result.errors.push(
                        `Email for tx ${tx.fioTransactionId}: ${emailError instanceof Error ? emailError.message : "Unknown"}`,
                    );
                }
            }
        } catch (error) {
            // Handle duplicate (Prisma unique constraint on fioTransactionId)
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
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

async function createBankTransaction(
    yearId: string | null,
    tx: ParsedBankTransaction,
    matchStatus: BankTransactionMatchStatus,
    submissionId?: string,
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
            processedAt: new Date(),
        },
    });
}
