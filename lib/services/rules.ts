import { cache } from "react";
import { db } from "@/lib/db";

// ============================================
// Admin Services
// ============================================

export const getRulesForYear = cache(async (yearId: string) => {
    return db.rule.findMany({
        where: { yearId },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            title: true,
            content: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
        },
    });
});

export const getRuleById = cache(async (ruleId: string) => {
    return db.rule.findUnique({
        where: { id: ruleId },
        select: {
            id: true,
            yearId: true,
            title: true,
            content: true,
            sortOrder: true,
        },
    });
});

// ============================================
// Public Services
// ============================================

export const getRulesForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.rule.findMany({
        where: { yearId: activeYear.id },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            title: true,
            content: true,
            sortOrder: true,
        },
    });
});
