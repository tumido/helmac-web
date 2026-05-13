import { cache } from "react";
import { db } from "@/lib/db";

// ============================================
// Admin Services
// ============================================

export const getSectionTypesForYear = cache(async (yearId: string) => {
    return db.sectionType.findMany({
        where: { yearId },
        orderBy: { sortOrder: "asc" },
        include: {
            sections: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                    subtitle: true,
                    description: true,
                    icon: true,
                    content: true,
                    showToc: true,
                    sortOrder: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
});

export const getSectionById = cache(async (sectionId: string) => {
    return db.section.findUnique({
        where: { id: sectionId },
        select: {
            id: true,
            title: true,
            subtitle: true,
            description: true,
            icon: true,
            content: true,
            showToc: true,
            sortOrder: true,
            sectionType: {
                select: {
                    id: true,
                    yearId: true,
                    slug: true,
                    label: true,
                },
            },
        },
    });
});

export const getSectionTypeById = cache(async (typeId: string) => {
    return db.sectionType.findUnique({
        where: { id: typeId },
        select: {
            id: true,
            yearId: true,
            label: true,
            slug: true,
            icon: true,
            sortOrder: true,
            pageTitle: true,
            pageSubtitle: true,
            metaTitle: true,
            metaDescription: true,
            featuredOnIndex: true,
            description: true,
        },
    });
});

// ============================================
// Public Services
// ============================================

export const getSectionTypeBySlugForActiveYear = cache(
    async (slug: string) => {
        const activeYear = await db.year.findFirst({
            where: { isActive: true, isArchived: false },
            select: { id: true, headerPhoto: true },
        });

        if (!activeYear) return null;

        const sectionType = await db.sectionType.findUnique({
            where: {
                yearId_slug: {
                    yearId: activeYear.id,
                    slug,
                },
            },
            select: {
                id: true,
                label: true,
                slug: true,
                icon: true,
                pageTitle: true,
                pageSubtitle: true,
                metaTitle: true,
                metaDescription: true,
                sections: {
                    orderBy: { sortOrder: "asc" },
                    select: {
                        id: true,
                        title: true,
                        subtitle: true,
                        description: true,
                        icon: true,
                        content: true,
                        showToc: true,
                        sortOrder: true,
                    },
                },
            },
        });

        if (!sectionType) return null;

        return { sectionType, year: activeYear };
    }
);

export const getSectionTypesForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.sectionType.findMany({
        where: { yearId: activeYear.id },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            label: true,
            slug: true,
            sections: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    });
});

export const getFeaturedSectionTypeForActiveYear = cache(
    async () => {
        const activeYear = await db.year.findFirst({
            where: { isActive: true, isArchived: false },
            select: { id: true },
        });

        if (!activeYear) return null;

        return db.sectionType.findFirst({
            where: {
                yearId: activeYear.id,
                featuredOnIndex: true,
            },
            select: {
                id: true,
                label: true,
                slug: true,
                icon: true,
                pageTitle: true,
                pageSubtitle: true,
                description: true,
                sections: {
                    orderBy: { sortOrder: "asc" },
                    select: {
                        id: true,
                        title: true,
                        subtitle: true,
                        description: true,
                        icon: true,
                    },
                },
            },
        });
    }
);
