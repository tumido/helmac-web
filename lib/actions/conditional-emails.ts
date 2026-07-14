"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import {
    createConditionalEmailSchema,
    updateConditionalEmailTemplateSchema,
} from "@/lib/validators/conditional-email";
import { parseEmailConditionalSectionsJson } from "@/lib/validators/email-section";
import { parseEmailAttachmentsJson } from "@/lib/validators/email-attachment";
import {
    syncConditionalEmailToV2,
    toggleConditionalEmailInV2,
    deleteConditionalEmailFromV2,
} from "@/lib/utils/v2-dual-write";

export async function createConditionalEmail(
    yearId: string,
    data: {
        name: string;
        conditionFieldId: string;
        conditionFieldName: string;
        conditionOperator: "equals" | "is_set" | "is_not_set" | "quantity_gt_zero" | "quantity_any_gt_zero";
        conditionValue?: string;
    },
) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const validated = createConditionalEmailSchema.safeParse(data);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const conditionValue =
            validated.data.conditionOperator === "equals" ||
            validated.data.conditionOperator === "quantity_gt_zero"
                ? validated.data.conditionValue ?? null
                : null;

        const conditionalEmail = await db.$transaction(async (tx) => {
            const ce = await tx.conditionalEmail.create({
                data: {
                    yearId,
                    name: validated.data.name,
                    conditionFieldId: validated.data.conditionFieldId,
                    conditionFieldName: validated.data.conditionFieldName,
                    conditionOperator: validated.data.conditionOperator,
                    conditionValue,
                },
            });

            const year = await tx.year.findUnique({
                where: { id: yearId },
                select: { registrationForm: { select: { id: true } } },
            });
            const formId = year?.registrationForm?.id;
            if (formId) {
                await syncConditionalEmailToV2(tx, ce.id, yearId, formId, {
                    name: validated.data.name,
                    conditionFieldId: validated.data.conditionFieldId,
                    conditionOperator: validated.data.conditionOperator,
                    conditionValue,
                });
            }

            return ce;
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
        await requireEditor();
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

    let sections;
    try {
        sections = parseEmailConditionalSectionsJson(formData.get("sectionsJson"));
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Neplatné podmíněné sekce" };
    }

    let attachments;
    try {
        attachments = parseEmailAttachmentsJson(formData.get("attachmentsJson"));
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Neplatné přílohy" };
    }

    try {
        const email = await db.$transaction(async (tx) => {
            const ce = await tx.conditionalEmail.update({
                where: { id: emailId },
                data: {
                    subject: validated.data.confirmationEmailSubject,
                    body: validated.data.confirmationEmailBody,
                    bcc: validated.data.confirmationEmailBcc,
                    accountId: validated.data.emailAccountId,
                    sections,
                    attachments,
                },
            });

            const year = await tx.year.findUnique({
                where: { id: ce.yearId },
                select: { registrationForm: { select: { id: true } } },
            });
            const formId = year?.registrationForm?.id;
            if (formId) {
                await syncConditionalEmailToV2(tx, emailId, ce.yearId, formId, {
                    name: ce.name,
                    conditionFieldId: ce.conditionFieldId,
                    conditionOperator: ce.conditionOperator,
                    conditionValue: ce.conditionValue,
                    subject: validated.data.confirmationEmailSubject,
                    body: validated.data.confirmationEmailBody,
                    bcc: validated.data.confirmationEmailBcc,
                    accountId: validated.data.emailAccountId,
                    sections,
                    attachments,
                    sortOrder: ce.sortOrder,
                });
            }

            return ce;
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
        await requireEditor();
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

        const email = await db.$transaction(async (tx) => {
            const ce = await tx.conditionalEmail.update({
                where: { id: emailId },
                data: { enabled },
            });
            const year = await tx.year.findUnique({
                where: { id: ce.yearId },
                select: { registrationForm: { select: { id: true } } },
            });
            const formId = year?.registrationForm?.id;
            if (formId) {
                await toggleConditionalEmailInV2(tx, emailId, ce.yearId, formId, enabled);
            }
            return ce;
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
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const email = await db.$transaction(async (tx) => {
            const ce = await tx.conditionalEmail.delete({
                where: { id: emailId },
            });
            const year = await tx.year.findUnique({
                where: { id: ce.yearId },
                select: { registrationForm: { select: { id: true } } },
            });
            const formId = year?.registrationForm?.id;
            if (formId) {
                await deleteConditionalEmailFromV2(tx, emailId, ce.yearId, formId);
            }
            return ce;
        });

        revalidatePath(`/admin/rocniky/${email.yearId}/emaily`);
        revalidatePath(`/admin/rocniky/${email.yearId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete conditional email:", error);
        return { error: "Nepodařilo se smazat podmíněný email" };
    }
}
