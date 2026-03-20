import { db } from "@/lib/db";

export async function getGlobalBankAccount() {
    return db.bankAccount.findFirst();
}
