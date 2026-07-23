import { cache } from "react";
import { db } from "@/lib/db";

export async function getGlobalBankAccount() {
    return db.bankAccount.findFirst();
}

export const hasMainEmailAccount = cache(async () => {
    const account = await db.emailAccount.findFirst({
        where: { isMain: true },
        select: { id: true },
    });
    return !!account;
});

export const hasConfiguredBankAccount = cache(async () => {
    const account = await db.bankAccount.findFirst({
        where: { bankAccountNumber: { not: null } },
        select: { id: true },
    });
    return !!account;
});
