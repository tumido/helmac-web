import { cache } from "react";
import { db } from "@/lib/db";

// ============================================
// Admin Services
// ============================================

export const getOffersForYear = cache(async (yearId: string) => {
    return db.offer.findMany({
        where: { yearId },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            title: true,
            subtitle: true,
            icon: true,
            content: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
        },
    });
});

export const getOfferById = cache(async (offerId: string) => {
    return db.offer.findUnique({
        where: { id: offerId },
        select: {
            id: true,
            yearId: true,
            title: true,
            subtitle: true,
            icon: true,
            content: true,
            showToc: true,
            sortOrder: true,
        },
    });
});

// ============================================
// Public Services
// ============================================

export const getOffersForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.offer.findMany({
        where: { yearId: activeYear.id },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            title: true,
            subtitle: true,
            icon: true,
            content: true,
            showToc: true,
            sortOrder: true,
        },
    });
});
