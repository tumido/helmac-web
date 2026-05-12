import { cache } from "react";
import { db } from "@/lib/db";

export interface NavSubItem {
    id: string;
    label: string;
}

export interface DynamicNavSection {
    label: string;
    href: string;
    subItems: NavSubItem[];
}

export interface NavigationData {
    program: NavSubItem[];
    sections: DynamicNavSection[];
}

function formatDayLabel(label: string, date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(
        2,
        "0"
    );
    const year = date.getFullYear();
    return `${label} - ${day}.${month}.${year}`;
}

export const getNavigationData = cache(
    async (): Promise<NavigationData> => {
        const activeYear = await db.year.findFirst({
            where: { isActive: true, isArchived: false },
            select: { id: true },
        });

        if (!activeYear) {
            return { program: [], sections: [] };
        }

        const [programDays, sectionTypes] =
            await Promise.all([
                db.programDay.findMany({
                    where: { yearId: activeYear.id },
                    orderBy: { sortOrder: "asc" },
                    select: {
                        id: true,
                        label: true,
                        date: true,
                    },
                }),
                db.sectionType.findMany({
                    where: { yearId: activeYear.id },
                    orderBy: { sortOrder: "asc" },
                    include: {
                        sections: {
                            orderBy: { sortOrder: "asc" },
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                }),
            ]);

        return {
            program: programDays.map((day) => ({
                id: day.id,
                label: formatDayLabel(
                    day.label,
                    day.date
                ),
            })),
            sections: sectionTypes.map((st) => ({
                label: st.label,
                href: `/${st.slug}`,
                subItems: st.sections.map((s) => ({
                    id: s.id,
                    label: s.title,
                })),
            })),
        };
    }
);
