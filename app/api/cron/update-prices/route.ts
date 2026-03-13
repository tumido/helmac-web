import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getApplicablePriceFromSummary } from "@/lib/utils/pricing";
import type { PricingSummaryData } from "@/lib/types/registration-form";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await db.registrationSubmission.findMany({
        where: {
            isPaid: false,
            pricingSummary: { not: Prisma.DbNull },
            status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        select: {
            id: true,
            totalPrice: true,
            pricingSummary: true,
        },
    });

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const submission of submissions) {
        try {
            const summary = submission.pricingSummary as unknown as PricingSummaryData;
            const { totalPrice, applicableTierIndex } = getApplicablePriceFromSummary(summary);

            if (totalPrice === submission.totalPrice) {
                skipped++;
                continue;
            }

            await db.registrationSubmission.update({
                where: { id: submission.id },
                data: {
                    totalPrice,
                    pricingSummary: {
                        ...summary,
                        applicableTierIndex,
                        totalPrice,
                    } as unknown as Prisma.InputJsonValue,
                },
            });
            updated++;
        } catch (error) {
            errors.push(`${submission.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    return NextResponse.json({
        success: true,
        processed: submissions.length,
        updated,
        skipped,
        errors,
        timestamp: new Date().toISOString(),
    });
}
