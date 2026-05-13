"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import {
    createHomepageStepSchema,
    updateHomepageStepSchema,
} from "@/lib/validators/homepage-steps";

export type HomepageStepActionState = {
    error?: {
        title?: string[];
        description?: string[];
        icon?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createHomepageStep(
    yearId: string,
    prevState: HomepageStepActionState,
    formData: FormData
): Promise<HomepageStepActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        title: formData.get("title"),
        description: formData.get("description"),
        icon: formData.get("icon"),
    };

    const validated = createHomepageStepSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: validated.error.flatten().fieldErrors,
        };
    }

    try {
        const maxOrder = await db.homepageStep.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.homepageStep.create({
            data: {
                yearId,
                title: validated.data.title,
                description: validated.data.description,
                icon: validated.data.icon,
                sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/uvod`);
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to create homepage step:", error);
        return {
            error: {
                _form: ["Nepodařilo se vytvořit krok"],
            },
        };
    }

    return { success: true };
}

export async function updateHomepageStep(
    stepId: string,
    prevState: HomepageStepActionState,
    formData: FormData
): Promise<HomepageStepActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        title: formData.get("title"),
        description: formData.get("description"),
        icon: formData.get("icon"),
    };

    const validated = updateHomepageStepSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: validated.error.flatten().fieldErrors,
        };
    }

    try {
        const step = await db.homepageStep.findUnique({
            where: { id: stepId },
        });

        if (!step) {
            return {
                error: { _form: ["Krok nenalezen"] },
            };
        }

        await db.homepageStep.update({
            where: { id: stepId },
            data: validated.data,
        });

        revalidatePath(
            `/admin/rocniky/${step.yearId}/uvod`
        );
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to update homepage step:", error);
        return {
            error: {
                _form: ["Nepodařilo se upravit krok"],
            },
        };
    }

    return { success: true };
}

export async function deleteHomepageStep(stepId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const step = await db.homepageStep.delete({
            where: { id: stepId },
        });

        revalidatePath(
            `/admin/rocniky/${step.yearId}/uvod`
        );
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete homepage step:", error);
        return { error: "Nepodařilo se smazat krok" };
    }
}

export async function reorderHomepageSteps(
    yearId: string,
    stepIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.$transaction(
            stepIds.map((id, index) =>
                db.homepageStep.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${yearId}/uvod`);
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error(
            "Failed to reorder homepage steps:",
            error
        );
        return {
            error: "Nepodařilo se změnit pořadí kroků",
        };
    }
}
