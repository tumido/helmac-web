"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
    createProgramDaySchema,
    updateProgramDaySchema,
} from "@/lib/validators/program";

export type ProgramDayActionState = {
    error?: {
        date?: string[];
        label?: string[];
        sortOrder?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createProgramDay(
    yearId: string,
    prevState: ProgramDayActionState,
    formData: FormData
): Promise<ProgramDayActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        date: formData.get("date"),
        label: formData.get("label"),
        sortOrder: formData.get("sortOrder") || undefined,
    };

    const validated = createProgramDaySchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if date already exists for this year
        const existing = await db.programDay.findUnique({
            where: {
                yearId_date: {
                    yearId,
                    date: validated.data.date,
                },
            },
        });

        if (existing) {
            return { error: { date: ["Den s timto datem jiz existuje"] } };
        }

        // Get max sort order
        const maxOrder = await db.programDay.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.programDay.create({
            data: {
                yearId,
                date: validated.data.date,
                label: validated.data.label,
                sortOrder:
                    validated.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/program`);
    } catch (error) {
        console.error("Failed to create program day:", error);
        return { error: { _form: ["Nepodarilo se vytvorit den programu"] } };
    }

    redirect(`/admin/rocniky/${yearId}/program`);
}

export async function updateProgramDay(
    dayId: string,
    prevState: ProgramDayActionState,
    formData: FormData
): Promise<ProgramDayActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        date: formData.get("date"),
        label: formData.get("label"),
        sortOrder: formData.get("sortOrder"),
    };

    const validated = updateProgramDaySchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const day = await db.programDay.findUnique({ where: { id: dayId } });

        if (!day) {
            return { error: { _form: ["Den programu nenalezen"] } };
        }

        // Check if date conflicts with another day
        if (
            validated.data.date &&
            validated.data.date.getTime() !== day.date.getTime()
        ) {
            const existing = await db.programDay.findUnique({
                where: {
                    yearId_date: {
                        yearId: day.yearId,
                        date: validated.data.date,
                    },
                },
            });

            if (existing) {
                return { error: { date: ["Den s timto datem jiz existuje"] } };
            }
        }

        await db.programDay.update({
            where: { id: dayId },
            data: {
                date: validated.data.date,
                label: validated.data.label,
                sortOrder: validated.data.sortOrder,
            },
        });

        revalidatePath(`/admin/rocniky/${day.yearId}/program`);
        revalidatePath(`/admin/rocniky/${day.yearId}/program/${dayId}`);
    } catch (error) {
        console.error("Failed to update program day:", error);
        return { error: { _form: ["Nepodarilo se upravit den programu"] } };
    }

    return { success: true };
}

export async function deleteProgramDay(dayId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const day = await db.programDay.delete({
            where: { id: dayId },
        });

        revalidatePath(`/admin/rocniky/${day.yearId}/program`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete program day:", error);
        return { error: "Nepodarilo se smazat den programu" };
    }
}

export async function reorderProgramDays(
    yearId: string,
    dayIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.$transaction(
            dayIds.map((id, index) =>
                db.programDay.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${yearId}/program`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder program days:", error);
        return { error: "Nepodarilo se zmenit poradi dnu" };
    }
}
