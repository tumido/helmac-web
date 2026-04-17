import { NextRequest, NextResponse } from "next/server";
import { runPaymentSync } from "@/lib/utils/sync-payments";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const syncResult = await runPaymentSync({ skipRateLimit: true });

    return NextResponse.json({
        success: !syncResult.error,
        ...syncResult,
        timestamp: new Date().toISOString(),
    });
}
