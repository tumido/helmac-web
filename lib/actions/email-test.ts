"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { replacePlaceholders, sendConfirmationEmail } from "@/lib/utils/email";

const sendTestEmailSchema = z.object({
    subject: z.string().min(1, "Předmět je povinný"),
    body: z.string().min(1, "Text emailu je povinný"),
    bcc: z.string().nullable().optional(),
    emailAccountId: z.string().nullable().optional(),
    recipient: z.string().email("Neplatná emailová adresa"),
    placeholderValues: z.record(z.string(), z.string()),
});

export type SendTestEmailInput = z.input<typeof sendTestEmailSchema>;

export async function sendTestEmail(
    input: SendTestEmailInput,
): Promise<{ success?: true; error?: string }> {
    await requireAdmin();

    const parsed = sendTestEmailSchema.safeParse(input);
    if (!parsed.success) {
        return {
            error: parsed.error.issues[0]?.message ?? "Neplatná data",
        };
    }

    const { subject, body, bcc, emailAccountId, recipient, placeholderValues } =
        parsed.data;

    const renderedSubject = replacePlaceholders(subject, placeholderValues);
    const renderedBody = replacePlaceholders(body, placeholderValues);

    try {
        const sent = await sendConfirmationEmail({
            to: recipient,
            subject: renderedSubject,
            body: renderedBody,
            bcc: bcc || undefined,
            accountId: emailAccountId || null,
        });

        if (!sent) {
            return { error: "Nepodařilo se odeslat email" };
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send test email:", error);
        return { error: "Nepodařilo se odeslat email" };
    }
}
