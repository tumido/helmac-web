"use server";

import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";

export interface LinkTarget {
    label: string;
    url: string;
    group: string;
}

const STATIC_TARGETS: LinkTarget[] = [
    { label: "Domov", url: "/", group: "Stránky" },
    { label: "Program", url: "/program", group: "Stránky" },
    { label: "Novinky", url: "/novinky", group: "Stránky" },
    { label: "Pravidla", url: "/pravidla", group: "Stránky" },
    { label: "Co nabízíme", url: "/co-nabizime", group: "Stránky" },
    { label: "Info", url: "/info", group: "Stránky" },
    { label: "Galerie", url: "/galerie", group: "Stránky" },
    { label: "Registrace", url: "/registrace", group: "Stránky" },
    { label: "Archiv", url: "/archiv", group: "Stránky" },
    { label: "GDPR", url: "/gdpr", group: "Stránky" },
];

export async function getLinkTargets(yearId?: string): Promise<LinkTarget[]> {
    await requireEditor();

    let targetYearId = yearId;
    if (!targetYearId) {
        const activeYear = await db.year.findFirst({
            where: { isActive: true, isArchived: false },
            select: { id: true },
        });
        targetYearId = activeYear?.id;
    }

    if (!targetYearId) {
        return STATIC_TARGETS;
    }

    const [news, programDays, offers, rules, infoSections] = await Promise.all([
        db.news.findMany({
            where: { yearId: targetYearId, isPublished: true },
            orderBy: { publishedAt: "desc" },
            select: { slug: true, title: true },
        }),
        db.programDay.findMany({
            where: { yearId: targetYearId },
            orderBy: { sortOrder: "asc" },
            select: { id: true, label: true },
        }),
        db.offer.findMany({
            where: { yearId: targetYearId },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
        }),
        db.rule.findMany({
            where: { yearId: targetYearId },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
        }),
        db.infoSection.findMany({
            where: { yearId: targetYearId },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
        }),
    ]);

    return [
        ...STATIC_TARGETS,
        ...news.map((n) => ({
            label: `Novinky | ${n.title}`,
            url: `/novinky/${n.slug}`,
            group: "Novinky",
        })),
        ...programDays.map((d) => ({
            label: `Program | ${d.label}`,
            url: `/program?tab=${d.id}`,
            group: "Program",
        })),
        ...offers.map((o) => ({
            label: `Co nabízíme | ${o.title}`,
            url: `/co-nabizime?tab=${o.id}`,
            group: "Co nabízíme",
        })),
        ...rules.map((r) => ({
            label: `Pravidla | ${r.title}`,
            url: `/pravidla?tab=${r.id}`,
            group: "Pravidla",
        })),
        ...infoSections.map((i) => ({
            label: `Info | ${i.title}`,
            url: `/info?tab=${i.id}`,
            group: "Info",
        })),
    ];
}
