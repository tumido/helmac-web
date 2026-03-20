import { Prisma, BankTransactionMatchStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { buildPlaceholders, replacePlaceholders, sendConfirmationEmail } from "@/lib/utils/email";
import { formatCzechAccount } from "@/lib/utils/spayd";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";
import type { ParsedBankTransaction } from "@/lib/utils/fio-api";

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
    yearId: string,
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

    // Fetch year config for email sending
    const year = await db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            paymentEmailEnabled: true,
            paymentEmailSubject: true,
            paymentEmailBody: true,
            paymentEmailBcc: true,
            paymentEmailAccountId: true,
            bankAccountPrefix: true,
            bankAccountNumber: true,
            bankAccountBankCode: true,
        },
    });

    if (!year) {
        result.errors.push("Year not found");
        return result;
    }

    // Cache form fields for email placeholders
    let formInputFields: { name: string; label: string; type: string }[] | null = null;

    async function getFormFields() {
        if (formInputFields !== null) return formInputFields;
        const form = await db.registrationForm.findFirst({
            where: { yearId },
            select: { fields: true },
        });
        if (!form) {
            formInputFields = [];
            return formInputFields;
        }
        const formData = migrateFormData(form.fields);
        formInputFields = getAllInputFields(formData.fields);
        return formInputFields;
    }

    for (const tx of transactions) {
        try {
            // 1. Skip outgoing transactions
            if (tx.amount <= 0) {
                await createBankTransaction(yearId, tx, BankTransactionMatchStatus.OUTGOING);
                result.outgoing++;
                continue;
            }

            // 2. No variable symbol
            if (!tx.variableSymbol) {
                await createBankTransaction(yearId, tx, BankTransactionMatchStatus.NO_VARIABLE_SYMBOL);
                result.noVs++;
                continue;
            }

            // 3. Lookup submission by VS
            const submission = await db.registrationSubmission.findFirst({
                where: {
                    variableSymbol: tx.variableSymbol,
                    yearId,
                },
                select: {
                    id: true,
                    isPaid: true,
                    totalPrice: true,
                    data: true,
                    formId: true,
                    adminNote: true,
                },
            });

            // 4. Unknown VS
            if (!submission) {
                await createBankTransaction(yearId, tx, BankTransactionMatchStatus.UNKNOWN_VS);
                result.unknownVs++;
                continue;
            }

            // 5. Already paid
            if (submission.isPaid) {
                await createBankTransaction(yearId, tx, BankTransactionMatchStatus.ALREADY_PAID, submission.id);
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

                await createBankTransaction(yearId, tx, BankTransactionMatchStatus.PARTIAL_PAYMENT, submission.id);
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

            await createBankTransaction(yearId, tx, matchStatus, submission.id);

            if (matchStatus === BankTransactionMatchStatus.OVERPAYMENT) {
                result.overpayment++;
            } else {
                result.matched++;
            }

            // 8. Send payment confirmation email
            if (
                year.paymentEmailEnabled &&
                year.paymentEmailSubject &&
                year.paymentEmailBody
            ) {
                try {
                    const fields = await getFormFields();
                    const emailField = fields.find((f) => f.type === "email");
                    const submissionData = submission.data as Record<string, unknown>;
                    const recipientEmail = emailField ? String(submissionData[emailField.name] ?? "") : "";

                    if (recipientEmail) {
                        const bankAccount = year.bankAccountNumber && year.bankAccountBankCode
                            ? formatCzechAccount(
                                year.bankAccountNumber,
                                year.bankAccountBankCode,
                                year.bankAccountPrefix ?? undefined,
                            )
                            : null;

                        const placeholders = buildPlaceholders({
                            submissionData,
                            variableSymbol: tx.variableSymbol,
                            totalPrice,
                            bankAccount,
                            yearNumber: year.year,
                            yearTitle: year.title,
                        });

                        placeholders.prijataCastka = `${tx.amount} Kč`;

                        const emailSubject = replacePlaceholders(year.paymentEmailSubject, placeholders);
                        const emailBody = replacePlaceholders(year.paymentEmailBody, placeholders);

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
    yearId: string,
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
