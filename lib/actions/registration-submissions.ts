"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import type { RegistrationStatus } from "@prisma/client";
import { sendConfirmationEmail, replacePlaceholders, buildPlaceholders, generateQRPaymentImage } from "@/lib/utils/email";
import { formatCzechAccount, czechAccountToIBAN } from "@/lib/utils/spayd";
import { getAllInputFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getGlobalBankAccount } from "@/lib/services/bank-account";

interface ActionResult {
    success?: boolean;
    error?: string;
}

export async function updateSubmissionStatus(
    submissionId: string,
    status: RegistrationStatus
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: { status },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update submission status:", error);
        return { error: "Nepodařilo se změnit stav registrace" };
    }
}

export async function toggleSubmissionPayment(
    submissionId: string,
    isPaid: boolean
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: {
                isPaid,
                paidAt: isPaid ? new Date() : null,
            },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle payment:", error);
        return { error: "Nepodařilo se změnit stav platby" };
    }
}

export async function updateSubmissionData(
    submissionId: string,
    data: Record<string, unknown>
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: { data: data as Prisma.InputJsonValue },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update submission data:", error);
        return { error: "Nepodařilo se aktualizovat data registrace" };
    }
}

export async function resendConfirmationEmail(submissionId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                data: true,
                variableSymbol: true,
                totalPrice: true,
                yearId: true,
                form: { select: { fields: true } },
                year: {
                    select: {
                        year: true,
                        title: true,
                        confirmationEmailEnabled: true,
                        confirmationEmailSubject: true,
                        confirmationEmailBody: true,
                        confirmationEmailBcc: true,
                        confirmationEmailAccountId: true,
                    },
                },
            },
        });

        if (!submission) {
            return { error: "Registrace nebyla nalezena" };
        }

        if (!submission.year.confirmationEmailSubject || !submission.year.confirmationEmailBody) {
            return { error: "Šablona emailu není nastavena" };
        }

        const formData = migrateFormData(submission.form.fields);
        const allInputFields = getAllInputFields(formData.fields);
        const submissionData = submission.data as Record<string, unknown>;

        // Find email field
        const emailField = allInputFields.find((f) => f.type === "email");
        const recipientEmail = emailField ? String(submissionData[emailField.name] ?? "") : "";

        if (!recipientEmail) {
            return { error: "Registrace neobsahuje emailovou adresu" };
        }

        const globalBank = await getGlobalBankAccount();
        const bankAccount = globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
            ? formatCzechAccount(
                globalBank.bankAccountNumber,
                globalBank.bankAccountBankCode,
                globalBank.bankAccountPrefix ?? undefined,
            )
            : null;

        const placeholders = buildPlaceholders({
            submissionData,
            variableSymbol: submission.variableSymbol,
            totalPrice: submission.totalPrice,
            bankAccount,
            yearNumber: submission.year.year,
            yearTitle: submission.year.title,
        });

        const subject = replacePlaceholders(submission.year.confirmationEmailSubject, placeholders);
        const body = replacePlaceholders(submission.year.confirmationEmailBody, placeholders);

        // Generate QR payment image if payment data is available
        let qrImageBuffer: Buffer | null = null;
        if (
            submission.totalPrice &&
            submission.totalPrice > 0 &&
            submission.variableSymbol &&
            globalBank?.bankAccountNumber &&
            globalBank?.bankAccountBankCode
        ) {
            const iban = czechAccountToIBAN(
                globalBank.bankAccountNumber,
                globalBank.bankAccountBankCode,
                globalBank.bankAccountPrefix ?? undefined,
            );
            if (iban) {
                qrImageBuffer = await generateQRPaymentImage({
                    iban,
                    amount: submission.totalPrice,
                    variableSymbol: submission.variableSymbol,
                });
            }
        }

        const sent = await sendConfirmationEmail({
            to: recipientEmail,
            subject,
            body,
            bcc: submission.year.confirmationEmailBcc ?? undefined,
            qrImageBuffer: qrImageBuffer ?? undefined,
            accountId: submission.year.confirmationEmailAccountId,
        });

        if (sent) {
            await db.registrationSubmission.update({
                where: { id: submissionId },
                data: { emailSent: true, emailSentAt: new Date() },
            });

            revalidatePath(`/admin/rocniky/${submission.yearId}/registrace/${submissionId}`);
            return { success: true };
        } else {
            return { error: "Nepodařilo se odeslat email" };
        }
    } catch (error) {
        console.error("Failed to resend confirmation email:", error);
        return { error: "Nepodařilo se odeslat email" };
    }
}

export async function updateAdminNote(
    submissionId: string,
    adminNote: string
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: { adminNote: adminNote || null },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update admin note:", error);
        return { error: "Nepodařilo se uložit poznámku" };
    }
}

export async function deleteSubmission(submissionId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.delete({
            where: { id: submissionId },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete submission:", error);
        return { error: "Nepodařilo se smazat registraci" };
    }
}
