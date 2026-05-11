import { cache } from "react";
import { db } from "@/lib/db";

// ============================================
// Admin Services
// ============================================

export const getInfoSectionsForYear = cache(async (yearId: string) => {
    return db.infoSection.findMany({
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

export const getInfoSectionById = cache(async (infoId: string) => {
    return db.infoSection.findUnique({
        where: { id: infoId },
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

export const getInfoSectionsForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.infoSection.findMany({
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
