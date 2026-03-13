import { cache } from "react";
import { db } from "@/lib/db";
import { migrateFormData } from "@/lib/utils/form-migration";

export interface NavSubItem {
    id: string;
    label: string;
}

export interface NavSubtabs {
    program: NavSubItem[];
    info: NavSubItem[];
    pravidla: NavSubItem[];
    nabidka: NavSubItem[];
}

function formatDayLabel(label: string, date: Date): string {
    const weekday = date.toLocaleDateString("cs-CZ", { weekday: "short" });
    const dayNum = date.getDate();
    return `${label} - ${weekday} ${dayNum}`;
}

export const getNavigationSubtabs = cache(async (): Promise<NavSubtabs> => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: { id: true },
    });

    if (!activeYear) {
        return { program: [], info: [], pravidla: [], nabidka: [] };
    }

    const [programDays, infoSections, rules, offers, registrationForm] = await Promise.all([
        db.programDay.findMany({
            where: { yearId: activeYear.id },
            orderBy: { sortOrder: "asc" },
            select: { id: true, label: true, date: true },
        }),
        db.infoSection.findMany({
            where: { yearId: activeYear.id },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
        }),
        db.rule.findMany({
            where: { yearId: activeYear.id },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
        }),
        db.offer.findMany({
            where: { yearId: activeYear.id },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
        }),
        db.registrationForm.findUnique({
            where: { yearId: activeYear.id },
            select: { fields: true },
        }),
    ]);

    return {
        program: programDays.map((day) => ({
            id: day.id,
            label: formatDayLabel(day.label, day.date),
        })),
        info: [
            ...infoSections.map((section) => ({
                id: section.id,
                label: section.title,
            })),
            ...(() => {
                if (!registrationForm) return [];
                const formData = migrateFormData(registrationForm.fields);
                const config = formData.infoStatsConfig;
                if (config?.enabled && config.stats.length > 0) {
                    return [{ id: "__stats__", label: "Statistiky" }];
                }
                return [];
            })(),
        ],
        pravidla: rules.map((rule) => ({
            id: rule.id,
            label: rule.title,
        })),
        nabidka: offers.map((offer) => ({
            id: offer.id,
            label: offer.title,
        })),
    };
});
