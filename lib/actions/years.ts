"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createYearSchema, updateYearSchema } from "@/lib/validators/year";

export type YearActionState = {
    error?: {
        year?: string[];
        title?: string[];
        subtitle?: string[];
        startDate?: string[];
        endDate?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createYear(
    prevState: YearActionState,
    formData: FormData
): Promise<YearActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        year: formData.get("year"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        startDate: formData.get("startDate") || undefined,
        endDate: formData.get("endDate") || undefined,
    };

    const validated = createYearSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if year already exists
        const existing = await db.year.findUnique({
            where: { year: validated.data.year },
        });

        if (existing) {
            return { error: { year: ["Tento rocnik jiz existuje"] } };
        }

        const year = await db.year.create({
            data: {
                year: validated.data.year,
                title: validated.data.title,
                subtitle: validated.data.subtitle,
                startDate: validated.data.startDate,
                endDate: validated.data.endDate,
            },
        });

        // Create default pages for new year
        await createDefaultPages(year.id);

        revalidatePath("/admin/rocniky");
    } catch (error) {
        console.error("Failed to create year:", error);
        return { error: { _form: ["Nepodarilo se vytvorit rocnik"] } };
    }

    redirect("/admin/rocniky");
}

export async function updateYear(
    yearId: string,
    prevState: YearActionState,
    formData: FormData
): Promise<YearActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        year: formData.get("year"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        startDate: formData.get("startDate") || undefined,
        endDate: formData.get("endDate") || undefined,
    };

    const validated = updateYearSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if changing year number and if it conflicts
        if (validated.data.year) {
            const existing = await db.year.findFirst({
                where: {
                    year: validated.data.year,
                    NOT: { id: yearId },
                },
            });

            if (existing) {
                return { error: { year: ["Tento rocnik jiz existuje"] } };
            }
        }

        await db.year.update({
            where: { id: yearId },
            data: {
                year: validated.data.year,
                title: validated.data.title,
                subtitle: validated.data.subtitle,
                startDate: validated.data.startDate,
                endDate: validated.data.endDate,
            },
        });

        revalidatePath("/admin/rocniky");
        revalidatePath(`/admin/rocniky/${yearId}`);
    } catch (error) {
        console.error("Failed to update year:", error);
        return { error: { _form: ["Nepodarilo se upravit rocnik"] } };
    }

    redirect("/admin/rocniky");
}

export async function setActiveYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.$transaction([
            // Deactivate all years
            db.year.updateMany({
                data: { isActive: false },
            }),
            // Activate selected year
            db.year.update({
                where: { id: yearId },
                data: { isActive: true, isArchived: false },
            }),
        ]);

        revalidatePath("/");
        revalidatePath("/admin/rocniky");
        return { success: true };
    } catch (error) {
        console.error("Failed to set active year:", error);
        return { error: "Nepodarilo se aktivovat rocnik" };
    }
}

export async function archiveYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const year = await db.year.findUnique({ where: { id: yearId } });

        if (year?.isActive) {
            return { error: "Nelze archivovat aktivni rocnik" };
        }

        await db.year.update({
            where: { id: yearId },
            data: { isArchived: true },
        });

        revalidatePath("/admin/rocniky");
        revalidatePath("/archiv");
        return { success: true };
    } catch (error) {
        console.error("Failed to archive year:", error);
        return { error: "Nepodarilo se archivovat rocnik" };
    }
}

export async function unarchiveYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: { isArchived: false },
        });

        revalidatePath("/admin/rocniky");
        return { success: true };
    } catch (error) {
        console.error("Failed to unarchive year:", error);
        return { error: "Nepodarilo se obnovit rocnik" };
    }
}

export async function deleteYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const year = await db.year.findUnique({ where: { id: yearId } });

        if (year?.isActive) {
            return { error: "Nelze smazat aktivni rocnik" };
        }

        await db.year.delete({
            where: { id: yearId },
        });

        revalidatePath("/admin/rocniky");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete year:", error);
        return { error: "Nepodarilo se smazat rocnik" };
    }
}

async function createDefaultPages(yearId: string) {
    const defaultPages = [
        { slug: "uvod", title: "Uvod", sortOrder: 0 },
        { slug: "program", title: "Program", sortOrder: 1 },
        { slug: "registrace", title: "Registrace", sortOrder: 2 },
        { slug: "pravidla", title: "Pravidla", sortOrder: 3 },
        { slug: "galerie", title: "Galerie", sortOrder: 4 },
        { slug: "na-pamatku", title: "Na pamatku", sortOrder: 5 },
    ];

    await db.page.createMany({
        data: defaultPages.map((page) => ({
            ...page,
            yearId,
            content: { sections: [] },
            isPublished: false,
        })),
    });
}
