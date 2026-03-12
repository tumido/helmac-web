"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveInfoStatsConfigSchema } from "@/lib/validators/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import type { InfoStatsConfig } from "@/lib/types/registration-form";

interface SaveInfoStatsConfigResult {
    success?: boolean;
    error?: string;
}

export async function saveInfoStatsConfig(
    yearId: string,
    config: InfoStatsConfig,
): Promise<SaveInfoStatsConfigResult> {
    await requireAdmin();

    const validated = saveInfoStatsConfigSchema.safeParse(config);
    if (!validated.success) {
        const firstError = validated.error.issues[0]?.message;
        return { error: firstError || "Neplatná data" };
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
            conditions: formData.conditions,
            pricingDefinitions: formData.pricingDefinitions,
            capacityLimits: formData.capacityLimits,
            showOptionCounts: formData.showOptionCounts,
            infoStatsConfig: validated.data,
            fields: formData.fields,
        };

        await db.registrationForm.update({
            where: { yearId },
            data: {
                fields: dataToStore as unknown as object,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/info`);
        revalidatePath("/info");

        return { success: true };
    } catch (error) {
        console.error("Failed to save info stats config:", error);
        return { error: "Nepodařilo se uložit nastavení info statistik" };
    }
}
