import { cache } from "react";
import { db } from "@/lib/db";

export const getActiveYear = cache(async () => {
    return db.year.findFirst({
        where: {
            isActive: true,
            isArchived: false,
        },
    });
});

export const getActiveYearWithPages = cache(async () => {
    return db.year.findFirst({
        where: {
            isActive: true,
            isArchived: false,
        },
        include: {
            pages: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    sortOrder: true,
                },
            },
        },
    });
});

export const getArchivedYears = cache(async () => {
    return db.year.findMany({
        where: {
            isArchived: true,
        },
        orderBy: { year: "desc" },
        select: {
            id: true,
            year: true,
            title: true,
            subtitle: true,
            startDate: true,
            endDate: true,
            headerPhoto: true,
        },
    });
});

export const getYearById = cache(async (id: string) => {
    return db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            subtitle: true,
            startDate: true,
            endDate: true,
            headerPhoto: true,
            heroPhoto: true,
            conditionalEmails: {
                select: { id: true, name: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });
});

export const getYearByNumber = cache(async (yearNumber: number) => {
    return db.year.findUnique({
        where: { year: yearNumber },
        include: {
            pages: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                },
            },
            albums: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    coverImage: true,
                    externalUrl: true,
                },
            },
            news: {
                where: { isPublished: true },
                orderBy: { publishedAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    publishedAt: true,
                },
            },
        },
    });
});
