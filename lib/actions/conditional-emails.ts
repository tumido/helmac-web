"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
    createConditionalEmailSchema,
    updateConditionalEmailTemplateSchema,
} from "@/lib/validators/conditional-email";

export async function createConditionalEmail(
    yearId: string,
    data: {
        name: string;
        conditionFieldId: string;
        conditionFieldName: string;
        conditionValue: string;
    },
) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const validated = createConditionalEmailSchema.safeParse(data);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const conditionalEmail = await db.conditionalEmail.create({
            data: {
                yearId,
                name: validated.data.name,
                conditionFieldId: validated.data.conditionFieldId,
                conditionFieldName: validated.data.conditionFieldName,
                conditionValue: validated.data.conditionValue,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/emaily`);
        revalidatePath(`/admin/rocniky/${yearId}`);
        return { success: true, id: conditionalEmail.id };
    } catch (error) {
        console.error("Failed to create conditional email:", error);
        return { error: "Nepodařilo se vytvořit podmíněný email" };
    }
}

export async function updateConditionalEmailTemplate(emailId: string, formData: FormData) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        confirmationEmailSubject: formData.get("confirmationEmailSubject") || "",
        confirmationEmailBody: formData.get("confirmationEmailBody") || "",
        confirmationEmailBcc: formData.get("confirmationEmailBcc") || null,
        emailAccountId: formData.get("emailAccountId") || null,
    };

    const validated = updateConditionalEmailTemplateSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const email = await db.conditionalEmail.update({
            where: { id: emailId },
            data: {
                subject: validated.data.confirmationEmailSubject,
                body: validated.data.confirmationEmailBody,
                bcc: validated.data.confirmationEmailBcc,
                accountId: validated.data.emailAccountId,
            },
        });

        revalidatePath(`/admin/rocniky/${email.yearId}/emaily`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update conditional email template:", error);
        return { error: "Nepodařilo se uložit šablonu emailu" };
    }
}

export async function toggleConditionalEmail(emailId: string, enabled: boolean) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        if (enabled) {
            const email = await db.conditionalEmail.findUnique({
                where: { id: emailId },
                select: { subject: true, body: true },
            });

            if (!email?.subject || !email?.body) {
                return { error: "Nejdříve nastavte předmět a text emailu" };
            }
        }

        const email = await db.conditionalEmail.update({
            where: { id: emailId },
            data: { enabled },
        });

        revalidatePath(`/admin/rocniky/${email.yearId}/emaily`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle conditional email:", error);
        return { error: "Nepodařilo se změnit stav podmíněného emailu" };
    }
}

export async function deleteConditionalEmail(emailId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const email = await db.conditionalEmail.delete({
            where: { id: emailId },
        });

        revalidatePath(`/admin/rocniky/${email.yearId}/emaily`);
        revalidatePath(`/admin/rocniky/${email.yearId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete conditional email:", error);
        return { error: "Nepodařilo se smazat podmíněný email" };
    }
}
