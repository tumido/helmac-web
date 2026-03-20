import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/utils/encryption";
import { fetchLastTransactions, FioRateLimitError } from "@/lib/utils/fio-api";
import { processTransactions, type MatchResult } from "@/lib/utils/payment-matching";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const years = await db.year.findMany({
        where: {
            fioSyncEnabled: true,
            encryptedFioToken: { not: null },
        },
        select: {
            id: true,
            year: true,
            encryptedFioToken: true,
        },
    });

    const results: { yearId: string; year: number; result?: MatchResult; error?: string }[] = [];

    for (let i = 0; i < years.length; i++) {
        const yearRecord = years[i];

        try {
            const token = decrypt(yearRecord.encryptedFioToken!);
            const transactions = await fetchLastTransactions(token);
            const matchResult = await processTransactions(yearRecord.id, transactions);

            await db.year.update({
                where: { id: yearRecord.id },
                data: { lastFioSyncAt: new Date() },
            });

            results.push({
                yearId: yearRecord.id,
                year: yearRecord.year,
                result: matchResult,
            });
        } catch (error) {
            const message = error instanceof FioRateLimitError
                ? "Rate limit — skipping remaining years"
                : error instanceof Error
                    ? error.message
                    : "Unknown error";

            results.push({
                yearId: yearRecord.id,
                year: yearRecord.year,
                error: message,
            });

            // Stop processing remaining years on rate limit
            if (error instanceof FioRateLimitError) {
                break;
            }
        }

        // Wait 31 seconds between API calls to respect rate limit
        if (i < years.length - 1) {
            await sleep(31000);
        }
    }

    return NextResponse.json({
        success: true,
        yearsProcessed: results.length,
        results,
        timestamp: new Date().toISOString(),
    });
}
