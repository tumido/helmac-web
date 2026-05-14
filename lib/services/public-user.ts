import { db } from "@/lib/db";
import type { PricingSummaryData } from "@/lib/types/registration-form";
import { getApplicablePriceFromSummary } from "@/lib/utils/pricing";

export async function getPublicUserProfile(userId: string) {
    return db.publicUser.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            emailVerifiedAt: true,
            createdAt: true,
        },
    });
}

/**
 * For each unpaid registration with a pricingSummary, recalculates the
 * applicable price based on the current date. If the price changed,
 * updates the DB record so all views stay consistent.
 */
async function refreshStalePrices(
    registrations: {
        id: string;
        isPaid: boolean;
        totalPrice: number | null;
        pricingSummary: unknown;
    }[],
) {
    for (const reg of registrations) {
        if (reg.isPaid || !reg.pricingSummary) continue;

        const summary = reg.pricingSummary as PricingSummaryData;
        if (!summary.tiers || summary.tiers.length === 0) continue;

        const { totalPrice, applicableTierIndex } = getApplicablePriceFromSummary(summary);

        if (totalPrice !== reg.totalPrice || applicableTierIndex !== summary.applicableTierIndex) {
            const updatedSummary: PricingSummaryData = {
                ...summary,
                applicableTierIndex,
                totalPrice,
            };

            await db.registrationSubmission.update({
                where: { id: reg.id },
                data: {
                    totalPrice,
                    pricingSummary: updatedSummary as object,
                },
            });

            // Reflect the update in the in-memory object returned to the caller
            reg.totalPrice = totalPrice;
            (reg.pricingSummary as PricingSummaryData).applicableTierIndex = applicableTierIndex;
            (reg.pricingSummary as PricingSummaryData).totalPrice = totalPrice;
        }
    }
}

export async function getPublicUserRegistrations(userId: string) {
    const registrations = await db.registrationSubmission.findMany({
        where: { publicUserId: userId, isTest: false },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            yearId: true,
            formId: true,
            data: true,
            status: true,
            isPaid: true,
            paidAt: true,
            totalPrice: true,
            pricingSummary: true,
            variableSymbol: true,
            createdAt: true,
            year: {
                select: {
                    year: true,
                    title: true,
                    registrationOpen: true,
                },
            },
            form: {
                select: {
                    fields: true,
                },
            },
        },
    });

    await refreshStalePrices(registrations);

    return registrations;
}

export async function getPublicUserPayments(userId: string) {
    const registrations = await db.registrationSubmission.findMany({
        where: {
            publicUserId: userId,
            isTest: false,
            totalPrice: { gt: 0 },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            status: true,
            isPaid: true,
            paidAt: true,
            totalPrice: true,
            pricingSummary: true,
            variableSymbol: true,
            createdAt: true,
            year: {
                select: {
                    year: true,
                    title: true,
                },
            },
        },
    });

    await refreshStalePrices(registrations);

    return registrations;
}
