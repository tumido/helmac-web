"use server";

import { z } from "zod";
import { requireEditor } from "@/lib/auth";
import { replacePlaceholders, sendConfirmationEmail, appendConditionalSections, collectMatchingSectionAttachments } from "@/lib/utils/email";
import { emailConditionalSectionsSchema } from "@/lib/validators/email-section";
import { emailAttachmentsSchema } from "@/lib/validators/email-attachment";
import type { FormField } from "@/lib/types/registration-form";

const sendTestEmailSchema = z.object({
    subject: z.string().min(1, "Předmět je povinný"),
    body: z.string().min(1, "Text emailu je povinný"),
    bcc: z
        .string()
        .email("Neplatný email pro BCC")
        .optional()
        .nullable()
        .transform((v) => v || null),
    emailAccountId: z.string().nullable().optional(),
    recipient: z.string().email("Neplatná emailová adresa"),
    placeholderValues: z.record(z.string(), z.string()),
    sections: emailConditionalSectionsSchema.optional(),
    allFields: z.array(z.unknown()).optional(),
    attachments: emailAttachmentsSchema.optional(),
});

export type SendTestEmailInput = z.input<typeof sendTestEmailSchema>;

export async function sendTestEmail(
    input: SendTestEmailInput,
): Promise<{ success?: true; error?: string }> {
    await requireEditor();

    const parsed = sendTestEmailSchema.safeParse(input);
    if (!parsed.success) {
        return {
            error: parsed.error.issues[0]?.message ?? "Neplatná data",
        };
    }

    const { subject, body, bcc, emailAccountId, recipient, placeholderValues, sections, allFields, attachments } =
        parsed.data;

    const renderedSubject = replacePlaceholders(subject, placeholderValues);
    const typedFields = (allFields ?? []) as FormField[];
    const bodyWithSections = sections && sections.length > 0
        ? appendConditionalSections({
            body,
            sections,
            rawSubmissionData: placeholderValues,
            allFields: typedFields,
        })
        : body;
    const renderedBody = replacePlaceholders(bodyWithSections, placeholderValues);

    const sectionAttachments = sections && sections.length > 0
        ? collectMatchingSectionAttachments({
            sections,
            rawSubmissionData: placeholderValues,
            allFields: typedFields,
        })
        : [];
    const finalAttachments = [
        ...(attachments?.map((a) => ({ filename: a.filename, url: a.url })) ?? []),
        ...sectionAttachments,
    ];

    try {
        const sent = await sendConfirmationEmail({
            to: recipient,
            subject: renderedSubject,
            body: renderedBody,
            bcc: bcc || undefined,
            accountId: emailAccountId || null,
            attachments: finalAttachments,
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
