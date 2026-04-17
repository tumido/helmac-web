import { NextResponse } from "next/server";
import { runPaymentSync } from "@/lib/utils/sync-payments";

export const dynamic = "force-dynamic";

export async function POST() {
    const syncResult = await runPaymentSync();
    return NextResponse.json(syncResult);
}
