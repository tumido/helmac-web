"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/utils/encryption";
import { setLastDate, FioRateLimitError } from "@/lib/utils/fio-api";
import { runPaymentSync } from "@/lib/utils/sync-payments";
import { updateBankAccountSchema } from "@/lib/validators/bank-account";
import { fioTokenSchema } from "@/lib/validators/bank-sync";

async function upsertBankAccount(data: Record<string, unknown>) {
    const existing = await db.bankAccount.findFirst();
    if (existing) {
        return db.bankAccount.update({
            where: { id: existing.id },
            data,
        });
    }
    return db.bankAccount.create({ data });
}

export async function updateGlobalBankAccount(formData: FormData) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        bankAccountPrefix: formData.get("bankAccountPrefix") || null,
        bankAccountNumber: formData.get("bankAccountNumber") || null,
        bankAccountBankCode: formData.get("bankAccountBankCode") || null,
    };

    const validated = updateBankAccountSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        await upsertBankAccount({
            bankAccountPrefix: validated.data.bankAccountPrefix,
            bankAccountNumber: validated.data.bankAccountNumber,
            bankAccountBankCode: validated.data.bankAccountBankCode,
        });

        revalidatePath("/admin/nastaveni/banka");
        revalidatePath("/registrace");
        return { success: true };
    } catch (error) {
        console.error("Failed to update bank account:", error);
        return { error: "Nepodařilo se uložit bankovní údaje" };
    }
}

export async function saveGlobalFioToken(formData: FormData) {
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
        await upsertBankAccount({ encryptedFioToken: encryptedToken });

        revalidatePath("/admin/nastaveni/banka");
        return { success: true };
    } catch (error) {
        console.error("Failed to save Fio token:", error);
        return { error: "Nepodařilo se uložit token" };
    }
}

export async function removeGlobalFioToken() {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const existing = await db.bankAccount.findFirst();
        if (existing) {
            await db.bankAccount.update({
                where: { id: existing.id },
                data: {
                    encryptedFioToken: null,
                    fioSyncEnabled: false,
                },
            });
        }

        revalidatePath("/admin/nastaveni/banka");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove Fio token:", error);
        return { error: "Nepodařilo se odebrat token" };
    }
}

export async function toggleGlobalFioSync(enabled: boolean) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const bankAccount = await db.bankAccount.findFirst();

        if (enabled && !bankAccount?.encryptedFioToken) {
            return { error: "Nejdříve nastavte Fio token" };
        }

        // On first enable, set the Fio cursor to today
        if (enabled && bankAccount?.encryptedFioToken) {
            try {
                const token = decrypt(bankAccount.encryptedFioToken);
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                await setLastDate(token, threeDaysAgo);
            } catch (error) {
                if (error instanceof FioRateLimitError) {
                    return { error: "Fio API limit — zkuste to za 30 sekund" };
                }
                return { error: "Nepodařilo se nastavit kurzor Fio API" };
            }
        }

        if (bankAccount) {
            await db.bankAccount.update({
                where: { id: bankAccount.id },
                data: { fioSyncEnabled: enabled },
            });
        }

        revalidatePath("/admin/nastaveni/banka");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle Fio sync:", error);
        return { error: "Nepodařilo se změnit stav synchronizace" };
    }
}

export async function triggerGlobalManualSync() {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const syncResult = await runPaymentSync({ skipRateLimit: true });

    if (syncResult.error) {
        return { error: syncResult.error === "rate-limit" ? "Fio API limit — zkuste to za 30 sekund" : "Synchronizace selhala" };
    }

    if (syncResult.skipped) {
        return { error: "Fio token není nastaven" };
    }

    revalidatePath("/admin/nastaveni/banka");
    return { success: true, result: syncResult.result };
}
