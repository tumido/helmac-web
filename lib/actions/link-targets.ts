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

    const [news, programDays, sectionTypes] = await Promise.all([
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
        db.sectionType.findMany({
            where: { yearId: targetYearId },
            orderBy: { sortOrder: "asc" },
            include: {
                sections: {
                    orderBy: { sortOrder: "asc" },
                    select: { id: true, title: true },
                },
            },
        }),
    ]);

    const sectionTargets: LinkTarget[] = sectionTypes.flatMap((st) => [
        { label: st.label, url: `/${st.slug}`, group: "Stránky" },
        ...st.sections.map((s) => ({
            label: `${st.label} | ${s.title}`,
            url: `/${st.slug}?tab=${s.id}`,
            group: st.label,
        })),
    ]);

    return [
        ...STATIC_TARGETS,
        ...sectionTargets,
        ...news.map((n) => ({
            label: `Novinky | ${n.title}`,
            url: `/novinky#${n.slug}`,
            group: "Novinky",
        })),
        ...programDays.map((d) => ({
            label: `Program | ${d.label}`,
            url: `/program?tab=${d.id}`,
            group: "Program",
        })),
    ];
}
