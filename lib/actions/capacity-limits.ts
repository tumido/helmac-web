"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveCapacityLimitsSchema } from "@/lib/validators/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import type { CapacityLimit } from "@/lib/types/registration-form";
import { syncCapacityLimitsToV2 } from "@/lib/utils/v2-dual-write";

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

        await db.$transaction(async (tx) => {
            const updated = await tx.registrationForm.update({
                where: { yearId },
                data: {
                    fields: dataToStore as unknown as object,
                },
                select: { id: true },
            });

            // Build field ID map from existing v2 fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const v2Fields = await (tx as any).v2FormField.findMany({
                where: { formId: updated.id, isActive: true },
            });
            const fieldIdMap: Record<string, string> = {};
            for (const f of v2Fields) {
                if (f.legacyId) fieldIdMap[f.legacyId] = f.id;
            }

            if (v2Fields.length > 0) {
                await syncCapacityLimitsToV2(
                    tx,
                    updated.id,
                    yearId,
                    validated.data,
                    fieldIdMap,
                );
            }
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
