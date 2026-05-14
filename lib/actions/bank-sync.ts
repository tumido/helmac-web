"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { paymentEmailTemplateSchema } from "@/lib/validators/bank-sync";
import { parseEmailConditionalSectionsJson } from "@/lib/validators/email-section";

export async function updatePaymentEmailTemplate(yearId: string, formData: FormData) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        paymentEmailSubject: formData.get("confirmationEmailSubject") || "",
        paymentEmailBody: formData.get("confirmationEmailBody") || "",
        paymentEmailBcc: formData.get("confirmationEmailBcc") || null,
        emailAccountId: formData.get("emailAccountId") || null,
    };

    const validated = paymentEmailTemplateSchema.safeParse(rawData);
    if (!validated.success) {
        // Map field errors back to the keys used by EmailTemplateEditor
        const fieldErrors = validated.error.flatten().fieldErrors;
        const mapped: Record<string, string[]> = {};
        if (fieldErrors.paymentEmailSubject) {
            mapped.confirmationEmailSubject = fieldErrors.paymentEmailSubject;
        }
        if (fieldErrors.paymentEmailBody) {
            mapped.confirmationEmailBody = fieldErrors.paymentEmailBody;
        }
        if (fieldErrors.paymentEmailBcc) {
            mapped.confirmationEmailBcc = fieldErrors.paymentEmailBcc;
        }
        return { error: mapped };
    }

    let sections;
    try {
        sections = parseEmailConditionalSectionsJson(formData.get("sectionsJson"));
    } catch (err) {
        return { error: { _form: [err instanceof Error ? err.message : "Neplatné podmíněné sekce"] } };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: {
                paymentEmailSubject: validated.data.paymentEmailSubject,
                paymentEmailBody: validated.data.paymentEmailBody,
                paymentEmailBcc: validated.data.paymentEmailBcc,
                paymentEmailAccountId: validated.data.emailAccountId,
                paymentEmailSections: sections,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/emaily`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update payment email template:", error);
        return { error: "Nepodařilo se uložit šablonu emailu" };
    }
}

export async function togglePaymentEmail(yearId: string, enabled: boolean) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        if (enabled) {
            const year = await db.year.findUnique({
                where: { id: yearId },
                select: {
                    paymentEmailSubject: true,
                    paymentEmailBody: true,
                },
            });

            if (!year?.paymentEmailSubject || !year?.paymentEmailBody) {
                return { error: "Nejdříve nastavte předmět a text emailu" };
            }
        }

        await db.year.update({
            where: { id: yearId },
            data: { paymentEmailEnabled: enabled },
        });

        revalidatePath(`/admin/rocniky/${yearId}/emaily`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle payment email:", error);
        return { error: "Nepodařilo se změnit stav emailu při platbě" };
    }
}
