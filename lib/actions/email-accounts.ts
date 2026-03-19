"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { createEmailAccountSchema, updateEmailAccountSchema } from "@/lib/validators/email-account";
import nodemailer from "nodemailer";

export type EmailAccountActionState = {
    error?: Record<string, string[]> | string;
    success?: boolean;
} | null;

export async function getEmailAccounts() {
    await requireAdmin();

    return db.emailAccount.findMany({
        select: {
            id: true,
            email: true,
            label: true,
            isMain: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    });
}

export async function createEmailAccount(
    prevState: EmailAccountActionState,
    formData: FormData,
): Promise<EmailAccountActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        label: formData.get("label") as string || undefined,
        isMain: formData.get("isMain") === "true",
    };

    const validated = createEmailAccountSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const existing = await db.emailAccount.findUnique({
            where: { email: validated.data.email },
        });
        if (existing) {
            return { error: { email: ["Tento email je již zaregistrován"] } };
        }

        const encryptedPassword = encrypt(validated.data.password);

        if (validated.data.isMain) {
            await db.$transaction([
                db.emailAccount.updateMany({
                    where: { isMain: true },
                    data: { isMain: false },
                }),
                db.emailAccount.create({
                    data: {
                        email: validated.data.email,
                        encryptedPassword,
                        label: validated.data.label ?? null,
                        isMain: true,
                    },
                }),
            ]);
        } else {
            await db.emailAccount.create({
                data: {
                    email: validated.data.email,
                    encryptedPassword,
                    label: validated.data.label ?? null,
                    isMain: validated.data.isMain,
                },
            });
        }

        revalidatePath("/admin/nastaveni/emaily");
        return { success: true };
    } catch (error) {
        console.error("Failed to create email account:", error);
        return { error: "Nepodařilo se vytvořit emailový účet" };
    }
}

export async function updateEmailAccount(
    id: string,
    formData: FormData,
): Promise<EmailAccountActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData: Record<string, unknown> = {
        label: formData.get("label") as string || undefined,
        isMain: formData.get("isMain") === "true" ? true : undefined,
    };

    const passwordValue = formData.get("password") as string;
    if (passwordValue) {
        rawData.password = passwordValue;
    }

    const validated = updateEmailAccountSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const updateData: { encryptedPassword?: string; label?: string | null; isMain?: boolean } = {};

        if (validated.data.password) {
            updateData.encryptedPassword = encrypt(validated.data.password);
        }
        if (validated.data.label !== undefined) {
            updateData.label = validated.data.label;
        }

        if (validated.data.isMain) {
            await db.$transaction([
                db.emailAccount.updateMany({
                    where: { isMain: true },
                    data: { isMain: false },
                }),
                db.emailAccount.update({
                    where: { id },
                    data: { ...updateData, isMain: true },
                }),
            ]);
        } else {
            if (validated.data.isMain === false) {
                // Check if this is the current main - don't allow unsetting
                const account = await db.emailAccount.findUnique({ where: { id } });
                if (account?.isMain) {
                    return { error: "Nelze zrušit hlavní účet. Nejdříve nastavte jiný účet jako hlavní." };
                }
            }
            await db.emailAccount.update({
                where: { id },
                data: updateData,
            });
        }

        revalidatePath("/admin/nastaveni/emaily");
        return { success: true };
    } catch (error) {
        console.error("Failed to update email account:", error);
        return { error: "Nepodařilo se upravit emailový účet" };
    }
}

export async function deleteEmailAccount(id: string): Promise<EmailAccountActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const account = await db.emailAccount.findUnique({ where: { id } });
        if (!account) {
            return { error: "Emailový účet nebyl nalezen" };
        }
        if (account.isMain) {
            return { error: "Nelze smazat hlavní emailový účet. Nejdříve nastavte jiný účet jako hlavní." };
        }

        await db.emailAccount.delete({ where: { id } });

        revalidatePath("/admin/nastaveni/emaily");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete email account:", error);
        return { error: "Nepodařilo se smazat emailový účet" };
    }
}

export async function testEmailAccount(id: string): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const account = await db.emailAccount.findUnique({ where: { id } });
        if (!account) {
            return { error: "Emailový účet nebyl nalezen" };
        }

        const password = decrypt(account.encryptedPassword);

        const transporter = nodemailer.createTransport({
            host: "smtp.seznam.cz",
            port: 465,
            secure: true,
            auth: {
                user: account.email,
                pass: password,
            },
        });

        await transporter.verify();
        transporter.close();

        return { success: true };
    } catch (error) {
        console.error("Failed to verify email account:", error);
        return { error: "Připojení k SMTP serveru selhalo. Zkontrolujte přihlašovací údaje." };
    }
}
