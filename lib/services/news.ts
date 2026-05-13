import { cache } from "react";
import { db } from "@/lib/db";

export const getPublishedNews = cache(
    async (yearId: string, limit?: number) => {
        return db.news.findMany({
            where: {
                yearId,
                isPublished: true,
            },
            orderBy: { publishedAt: "desc" },
            take: limit,
            select: {
                id: true,
                slug: true,
                title: true,
                content: true,
                actionButtons: true,
                publishedAt: true,
            },
        });
    }
);

export const getLatestNewsForActiveYear = cache(async (limit: number = 3) => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.news.findMany({
        where: {
            yearId: activeYear.id,
            isPublished: true,
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: {
            id: true,
            slug: true,
            title: true,
            content: true,
            showToc: true,
            actionButtons: true,
            publishedAt: true,
        },
    });
});

