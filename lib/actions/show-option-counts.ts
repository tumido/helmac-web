"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { saveShowOptionCountsSchema } from "@/lib/validators/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";

interface SaveShowOptionCountsResult {
    success?: boolean;
    error?: string;
}

export async function saveShowOptionCounts(
    yearId: string,
    showOptionCounts: string[],
): Promise<SaveShowOptionCountsResult> {
    await requireEditor();

    const validated = saveShowOptionCountsSchema.safeParse(showOptionCounts);
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
            ...formData,
            showOptionCounts: validated.data,
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
        console.error("Failed to save show option counts:", error);
        return { error: "Nepodařilo se uložit nastavení zobrazení počtů" };
    }
}
