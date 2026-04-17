import { db } from "@/lib/db";
import { decrypt } from "@/lib/utils/encryption";
import { fetchTransactionsByDateRange, FioRateLimitError } from "@/lib/utils/fio-api";
import { processTransactions, type MatchResult } from "@/lib/utils/payment-matching";

const RATE_LIMIT_MS = 35_000; // 35s (Fio's 30s limit + buffer)

export interface SyncResult {
    result?: MatchResult;
    skipped?: string;
    error?: string;
}

export async function runPaymentSync(options?: { skipRateLimit?: boolean }): Promise<SyncResult> {
    try {
        const bankAccount = await db.bankAccount.findFirst({
            where: { encryptedFioToken: { not: null } },
        });

        if (!bankAccount?.encryptedFioToken) {
            return { skipped: "no-token" };
        }

        // Rate limit guard
        if (!options?.skipRateLimit && bankAccount.lastFioSyncAt) {
            const elapsed = Date.now() - bankAccount.lastFioSyncAt.getTime();
            if (elapsed < RATE_LIMIT_MS) {
                console.log("[sync-payments] Skipped — last sync was", Math.round(elapsed / 1000), "s ago");
                return { skipped: "rate-limit" };
            }
        }

        const token = decrypt(bankAccount.encryptedFioToken);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const today = new Date();

        console.log("[sync-payments] Fetching transactions from", threeDaysAgo.toISOString().split("T")[0], "to", today.toISOString().split("T")[0]);

        const transactions = await fetchTransactionsByDateRange(token, threeDaysAgo, today);
        console.log("[sync-payments] Fetched transactions:", transactions.length);

        if (transactions.length > 0) {
            console.log("[sync-payments] First transaction:", JSON.stringify({
                id: transactions[0].fioTransactionId,
                date: transactions[0].date,
                amount: transactions[0].amount,
                vs: transactions[0].variableSymbol,
                counterpart: transactions[0].counterpartName,
            }));
        }

        const result = await processTransactions(transactions);
        console.log("[sync-payments] Result:", JSON.stringify(result));

        await db.bankAccount.update({
            where: { id: bankAccount.id },
            data: { lastFioSyncAt: new Date() },
        });

        return { result };
    } catch (error) {
        if (error instanceof FioRateLimitError) {
            console.log("[sync-payments] Fio rate limit hit");
            return { error: "rate-limit" };
        }
        console.error("[sync-payments] Error:", error);
        return { error: error instanceof Error ? error.message : "Unknown error" };
    }
}
