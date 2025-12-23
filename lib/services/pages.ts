import { cache } from "react";
import { db } from "@/lib/db";

export const getPublishedPageBySlug = cache(
    async (yearId: string, slug: string) => {
        return db.page.findFirst({
            where: {
                yearId,
                slug,
                isPublished: true,
            },
            select: {
                id: true,
                slug: true,
                title: true,
                content: true,
                seoTitle: true,
                seoDesc: true,
            },
        });
    }
);

export const getPageBySlugForActiveYear = cache(async (slug: string) => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return null;

    return db.page.findFirst({
        where: {
            yearId: activeYear.id,
            slug,
            isPublished: true,
        },
        select: {
            id: true,
            slug: true,
            title: true,
            content: true,
            seoTitle: true,
            seoDesc: true,
        },
    });
});

export const getPublishedPagesForYear = cache(async (yearId: string) => {
    return db.page.findMany({
        where: {
            yearId,
            isPublished: true,
        },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            slug: true,
            title: true,
        },
    });
});
