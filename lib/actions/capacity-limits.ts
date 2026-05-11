"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveCapacityLimitsSchema } from "@/lib/validators/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import type { CapacityLimit } from "@/lib/types/registration-form";

interface SaveCapacityLimitsResult {
    success?: boolean;
    error?: string;
}

export async function saveCapacityLimits(
    yearId: string,
    capacityLimits: CapacityLimit[],
): Promise<SaveCapacityLimitsResult> {
    await requireAdmin();

    const validated = saveCapacityLimitsSchema.safeParse(capacityLimits);
    if (!validated.success) {
        const firstError = validated.error.issues[0]?.message;
        return { error: firstError || "Neplatná data limitů kapacity" };
    }

    try {
        const form = await db.registrationForm.findUnique({
            where: { yearId },
            select: { fields: true },
        });

        if (!form) {
            return { error: "Registrační formulář neexistuje" };
        }

        const formData = migrateFormData(form.fields);
        const dataToStore = {
            ...formData,
            capacityLimits: validated.data,
        };

        await db.registrationForm.update({
            where: { yearId },
            data: {
                fields: dataToStore as unknown as object,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}`);
        revalidatePath(`/admin/rocniky/${yearId}/registrace`);
        revalidatePath("/registrace");

        return { success: true };
    } catch (error) {
        console.error("Failed to save capacity limits:", error);
        return { error: "Nepodařilo se uložit limity kapacity" };
    }
}
