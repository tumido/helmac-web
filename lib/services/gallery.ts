import { cache } from "react";
import { db } from "@/lib/db";

const albumPreviewSelect = {
    id: true,
    slug: true,
    title: true,
    description: true,
    coverImage: true,
    year: {
        select: { year: true },
    },
    _count: {
        select: { images: true },
    },
} as const;

const albumDetailSelect = {
    id: true,
    slug: true,
    title: true,
    description: true,
    coverImage: true,
    year: {
        select: { year: true },
    },
    images: {
        orderBy: { sortOrder: "asc" as const },
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
} as const;

export const getAllPublishedAlbums = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    const albums = await db.album.findMany({
        where: { isPublished: true },
        orderBy: [
            { year: { year: "desc" } },
            { sortOrder: "asc" },
        ],
        select: {
            ...albumPreviewSelect,
            yearId: true,
        },
    });

    if (!activeYear) return albums;

    // Move active-year albums to the front
    const activeYearAlbums = albums.filter((a) => a.yearId === activeYear.id);
    const otherAlbums = albums.filter((a) => a.yearId !== activeYear.id);
    return [...activeYearAlbums, ...otherAlbums];
});

export const getPublishedAlbums = cache(async (yearId: string) => {
    return db.album.findMany({
        where: {
            yearId,
            isPublished: true,
        },
        orderBy: { sortOrder: "asc" },
        select: albumPreviewSelect,
    });
});

export const getAlbumByYearAndSlug = cache(
    async (yearNumber: number, slug: string) => {
        return db.album.findFirst({
            where: {
                slug,
                isPublished: true,
                year: { year: yearNumber },
            },
            select: albumDetailSelect,
        });
    }
);

export const getAlbumWithImages = cache(
    async (yearId: string, slug: string) => {
        return db.album.findFirst({
            where: {
                yearId,
                slug,
                isPublished: true,
            },
            select: albumDetailSelect,
        });
    }
);

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
            select: albumPreviewSelect,
        });
    }
);
