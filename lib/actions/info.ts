"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createInfoSectionSchema, updateInfoSectionSchema } from "@/lib/validators/info";

export type InfoSectionActionState = {
    error?: {
        title?: string[];
        content?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createInfoSection(
    yearId: string,
    prevState: InfoSectionActionState,
    formData: FormData
): Promise<InfoSectionActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
    };

    const validated = createInfoSectionSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Get max sortOrder for auto-ordering
        const maxOrder = await db.infoSection.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.infoSection.create({
            data: {
                yearId,
                title: validated.data.title,
                content: validated.data.content,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/info`);
        revalidatePath("/info");
    } catch (error) {
        console.error("Failed to create info section:", error);
        return { error: { _form: ["Nepodarilo se vytvorit info sekci"] } };
    }

    redirect(`/admin/rocniky/${yearId}/info`);
}

export async function updateInfoSection(
    infoId: string,
    prevState: InfoSectionActionState,
    formData: FormData
): Promise<InfoSectionActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
    };

    const validated = updateInfoSectionSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    let yearId: string;

    try {
        const infoSection = await db.infoSection.findUnique({
            where: { id: infoId },
            select: { yearId: true },
        });

        if (!infoSection) {
            return { error: { _form: ["Info sekce nenalezena"] } };
        }

        yearId = infoSection.yearId;

        await db.infoSection.update({
            where: { id: infoId },
            data: {
                title: validated.data.title,
                content: validated.data.content,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/info`);
        revalidatePath("/info");
    } catch (error) {
        console.error("Failed to update info section:", error);
        return { error: { _form: ["Nepodarilo se upravit info sekci"] } };
    }

    redirect(`/admin/rocniky/${yearId}/info`);
}

export async function deleteInfoSection(infoId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.infoSection.delete({
            where: { id: infoId },
        });

        revalidatePath("/info");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete info section:", error);
        return { error: "Nepodarilo se smazat info sekci" };
    }
}

export async function reorderInfoSections(
    yearId: string,
    infoSectionIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.$transaction(
            infoSectionIds.map((id, index) =>
                db.infoSection.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${yearId}/info`);
        revalidatePath("/info");
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder info sections:", error);
        return { error: "Nepodarilo se zmenit poradi info sekci" };
    }
}
