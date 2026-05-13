import { cache } from "react";
import { db } from "@/lib/db";

export const getHomepageStepsForYear = cache(
    async (yearId: string) => {
        return db.homepageStep.findMany({
            where: { yearId },
            orderBy: { sortOrder: "asc" },
        });
    }
);

export const getHomepageStepsForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.homepageStep.findMany({
        where: { yearId: activeYear.id },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            title: true,
            description: true,
            icon: true,
            sortOrder: true,
        },
    });
});
