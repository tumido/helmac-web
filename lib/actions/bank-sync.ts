"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { fetchLastTransactions, setLastDate, FioRateLimitError } from "@/lib/utils/fio-api";
import { processTransactions } from "@/lib/utils/payment-matching";
import { fioTokenSchema, paymentEmailTemplateSchema } from "@/lib/validators/bank-sync";

export async function saveFioToken(yearId: string, formData: FormData) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        fioToken: formData.get("fioToken") || "",
    };

    const validated = fioTokenSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const encryptedToken = encrypt(validated.data.fioToken);

        await db.year.update({
            where: { id: yearId },
            data: { encryptedFioToken: encryptedToken },
        });

        revalidatePath(`/admin/rocniky/${yearId}/registrace/banka`);
        return { success: true };
    } catch (error) {
        console.error("Failed to save Fio token:", error);
        return { error: "Nepodařilo se uložit token" };
    }
}

export async function removeFioToken(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: {
                encryptedFioToken: null,
                fioSyncEnabled: false,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/registrace/banka`);
        return { success: true };
    } catch (error) {
        console.error("Failed to remove Fio token:", error);
        return { error: "Nepodařilo se odebrat token" };
    }
}

export async function toggleFioSync(yearId: string, enabled: boolean) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const year = await db.year.findUnique({
            where: { id: yearId },
            select: { encryptedFioToken: true },
        });

        if (enabled && !year?.encryptedFioToken) {
            return { error: "Nejdříve nastavte Fio token" };
        }

        // On first enable, set the Fio cursor to today
        if (enabled && year?.encryptedFioToken) {
            try {
                const token = decrypt(year.encryptedFioToken);
                await setLastDate(token, new Date());
            } catch (error) {
                if (error instanceof FioRateLimitError) {
                    return { error: "Fio API limit — zkuste to za 30 sekund" };
                }
                return { error: "Nepodařilo se nastavit kurzor Fio API" };
            }
        }

        await db.year.update({
            where: { id: yearId },
            data: { fioSyncEnabled: enabled },
        });

        revalidatePath(`/admin/rocniky/${yearId}/registrace/banka`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle Fio sync:", error);
        return { error: "Nepodařilo se změnit stav synchronizace" };
    }
}

export async function triggerManualSync(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const year = await db.year.findUnique({
            where: { id: yearId },
            select: { encryptedFioToken: true },
        });

        if (!year?.encryptedFioToken) {
            return { error: "Fio token není nastaven" };
        }

        const token = decrypt(year.encryptedFioToken);
        const transactions = await fetchLastTransactions(token);
        const result = await processTransactions(yearId, transactions);

        await db.year.update({
            where: { id: yearId },
            data: { lastFioSyncAt: new Date() },
        });

        revalidatePath(`/admin/rocniky/${yearId}/registrace/banka`);
        revalidatePath(`/admin/rocniky/${yearId}/registrace/transakce`);
        revalidatePath(`/admin/rocniky/${yearId}/registrace/prihlasky`);
        return { success: true, result };
    } catch (error) {
        if (error instanceof FioRateLimitError) {
            return { error: "Fio API limit — zkuste to za 30 sekund" };
        }
        console.error("Failed to trigger manual sync:", error);
        return { error: "Synchronizace selhala" };
    }
}

export async function updatePaymentEmailTemplate(yearId: string, formData: FormData) {
    try {
        await requireAdmin();
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

    try {
        await db.year.update({
            where: { id: yearId },
            data: {
                paymentEmailSubject: validated.data.paymentEmailSubject,
                paymentEmailBody: validated.data.paymentEmailBody,
                paymentEmailBcc: validated.data.paymentEmailBcc,
                paymentEmailAccountId: validated.data.emailAccountId,
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
        await requireAdmin();
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
