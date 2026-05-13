import { cache } from "react";
import { db } from "@/lib/db";

// ============================================
// Public Services (for public pages)
// ============================================

export const getProgramDaysForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    return db.programDay.findMany({
        where: { yearId: activeYear.id },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            date: true,
            label: true,
            sortOrder: true,
        },
    });
});

export const getPublishedEventsForDay = cache(async (dayId: string) => {
    return db.programEvent.findMany({
        where: {
            dayId,
            isPublished: true,
        },
        orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
        select: {
            id: true,
            startTime: true,
            endTime: true,
            title: true,
            description: true,
            location: true,
            imageUrl: true,
            tags: true,
            storyContent: true,
        },
    });
});

export const getAllPublishedTags = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return [];

    const events = await db.programEvent.findMany({
        where: {
            isPublished: true,
            day: { yearId: activeYear.id },
        },
        select: { tags: true },
    });

    // Extract unique tags
    const tagSet = new Set<string>();
    events.forEach((event) => {
        event.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
});

export const getProgramScheduleForActiveYear = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) return null;

    const days = await db.programDay.findMany({
        where: { yearId: activeYear.id },
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            date: true,
            label: true,
            sortOrder: true,
            events: {
                where: { isPublished: true },
                orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    title: true,
                    description: true,
                    location: true,
                    imageUrl: true,
                    tags: true,
                    storyContent: true,
                    actionButtons: true,
                },
            },
        },
    });

    return { yearId: activeYear.id, days };
});

// ============================================
// Admin Services
// ============================================

export const getProgramDaysForYear = cache(async (yearId: string) => {
    return db.programDay.findMany({
        where: { yearId },
        orderBy: { sortOrder: "asc" },
        include: {
            _count: { select: { events: true } },
        },
    });
});

export const getProgramDayWithEvents = cache(async (dayId: string) => {
    return db.programDay.findUnique({
        where: { id: dayId },
        include: {
            year: { select: { id: true, year: true, title: true } },
            events: {
                orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
            },
        },
    });
});

export const getProgramEvent = cache(async (eventId: string) => {
    return db.programEvent.findUnique({
        where: { id: eventId },
        include: {
            day: {
                select: {
                    id: true,
                    label: true,
                    date: true,
                    year: { select: { id: true, year: true, title: true } },
                },
            },
        },
    });
});

export const getAllTagsForYear = cache(async (yearId: string) => {
    const events = await db.programEvent.findMany({
        where: {
            day: { yearId },
        },
        select: { tags: true },
    });

    const tagSet = new Set<string>();
    events.forEach((event) => {
        event.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
});
