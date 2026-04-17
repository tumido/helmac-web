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
                excerpt: true,
                coverImage: true,
                publishedAt: true,
                author: {
                    select: {
                        name: true,
                    },
                },
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
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            author: {
                select: { name: true },
            },
        },
    });
});

export const getNewsBySlug = cache(async (yearId: string, slug: string) => {
    return db.news.findFirst({
        where: {
            yearId,
            slug,
            isPublished: true,
        },
        select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            content: true,
            coverImage: true,
            showToc: true,
            publishedAt: true,
            author: {
                select: { name: true },
            },
        },
    });
});

export const getNewsBySlugForActiveYear = cache(async (slug: string) => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return null;

    return db.news.findFirst({
        where: {
            yearId: activeYear.id,
            slug,
            isPublished: true,
        },
        select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            content: true,
            coverImage: true,
            showToc: true,
            publishedAt: true,
            author: {
                select: { name: true },
            },
        },
    });
});
