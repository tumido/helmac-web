import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
    kickEmailQueue,
    processEmailQueue,
    waitForCapHeadroom,
} from "@/lib/utils/email-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Self-chaining queue processor: each invocation sends one throttled batch,
// then re-invokes itself via kickEmailQueue() until no pending items remain.
// Vercel Hobby crons run only once a day, hence this chain instead of a
// minute-level cron.
async function handle(request: NextRequest) {
    // Fail closed: without a secret the comparison below would accept
    // the literal "Bearer undefined"
    if (!process.env.CRON_SECRET) {
        console.error("Email queue processor: CRON_SECRET is not configured");
        return NextResponse.json(
            { error: "CRON_SECRET is not configured" },
            { status: 500 },
        );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startedAt = Date.now();

    try {
        const result = await processEmailQueue();

        if (result.capReached && result.remaining > 0) {
            // Hourly/daily cap hit: idle here so the chain survives the wait
            await waitForCapHeadroom(startedAt);
        }

        if (result.remaining > 0) {
            after(() => kickEmailQueue());
        }

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Email queue processing failed:", error);
        return NextResponse.json(
            { error: "Email queue processing failed" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    return handle(request);
}

// GET supported for manual curl testing with the same Bearer auth
export async function GET(request: NextRequest) {
    return handle(request);
}
