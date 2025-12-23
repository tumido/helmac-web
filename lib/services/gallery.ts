import { cache } from "react";
import { db } from "@/lib/db";

export const getPublishedAlbums = cache(async (yearId: string) => {
    return db.album.findMany({
        where: {
            yearId,
            isPublished: true,
        },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            coverImage: true,
            _count: {
                select: { images: true },
            },
        },
    });
});

export const getAlbumsForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.album.findMany({
        where: {
            yearId: activeYear.id,
            isPublished: true,
        },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            coverImage: true,
            _count: {
                select: { images: true },
            },
        },
    });
});

export const getAlbumWithImages = cache(
    async (yearId: string, slug: string) => {
        return db.album.findFirst({
            where: {
                yearId,
                slug,
                isPublished: true,
            },
            select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                coverImage: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                    select: {
                        id: true,
                        url: true,
                        thumbnailUrl: true,
                        title: true,
                        description: true,
                        altText: true,
                        width: true,
                        height: true,
                    },
                },
            },
        });
    }
);

export const getAlbumBySlugForActiveYear = cache(async (slug: string) => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return null;

    return db.album.findFirst({
        where: {
            yearId: activeYear.id,
            slug,
            isPublished: true,
        },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            coverImage: true,
            images: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    url: true,
                    thumbnailUrl: true,
                    title: true,
                    description: true,
                    altText: true,
                    width: true,
                    height: true,
                },
            },
        },
    });
});

export const getLatestAlbumsForActiveYear = cache(
    async (limit: number = 4) => {
        const activeYear = await db.year.findFirst({
            where: { isActive: true, isArchived: false },
            select: { id: true },
        });

        if (!activeYear) return [];

        return db.album.findMany({
            where: {
                yearId: activeYear.id,
                isPublished: true,
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                coverImage: true,
                _count: {
                    select: { images: true },
                },
            },
        });
    }
);
