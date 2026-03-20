import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/utils/encryption";
import { fetchLastTransactions, FioRateLimitError } from "@/lib/utils/fio-api";
import { processTransactions, type MatchResult } from "@/lib/utils/payment-matching";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bankAccount = await db.bankAccount.findFirst({
        where: {
            fioSyncEnabled: true,
            encryptedFioToken: { not: null },
        },
    });

    if (!bankAccount?.encryptedFioToken) {
        return NextResponse.json({
            success: true,
            message: "No bank account with sync enabled",
            timestamp: new Date().toISOString(),
        });
    }

    let result: MatchResult | undefined;
    let error: string | undefined;

    try {
        const token = decrypt(bankAccount.encryptedFioToken);
        const transactions = await fetchLastTransactions(token);
        result = await processTransactions(transactions);

        await db.bankAccount.update({
            where: { id: bankAccount.id },
            data: { lastFioSyncAt: new Date() },
        });
    } catch (err) {
        error = err instanceof FioRateLimitError
            ? "Rate limit"
            : err instanceof Error
                ? err.message
                : "Unknown error";
    }

    return NextResponse.json({
        success: !error,
        result,
        error,
        timestamp: new Date().toISOString(),
    });
}
