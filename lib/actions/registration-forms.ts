"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveRegistrationFormSchema } from "@/lib/validators/registration-form";
import type { RegistrationFormData } from "@/lib/types/registration-form";

interface SaveFormResult {
    success?: boolean;
    error?: string;
}

export async function saveRegistrationForm(yearId: string, formData: RegistrationFormData): Promise<SaveFormResult> {
    await requireAdmin();

    const validated = saveRegistrationFormSchema.safeParse(formData);

    if (!validated.success) {
        const fieldErrors = validated.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors).flat()[0];
        const formErrors = validated.error.flatten().formErrors;
        const firstFormError = formErrors[0];
        return { error: firstError || firstFormError || "Neplatná data formuláře" };
    }

    try {
        const dataToStore = {
            conditions: validated.data.conditions,
            pricingDefinitions: validated.data.pricingDefinitions,
            capacityLimits: validated.data.capacityLimits,
            showOptionCounts: validated.data.showOptionCounts,
            infoStatsConfig: formData.infoStatsConfig,
            fields: validated.data.fields,
        };

        await db.registrationForm.upsert({
            where: { yearId },
            create: {
                yearId,
                fields: dataToStore as unknown as object,
            },
            update: {
                fields: dataToStore as unknown as object,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}`);
        revalidatePath("/registrace");

        return { success: true };
    } catch (error) {
        console.error("Failed to save registration form:", error);
        return { error: "Nepodařilo se uložit formulář" };
    }
}

export async function deleteRegistrationForm(yearId: string): Promise<SaveFormResult> {
    await requireAdmin();

    try {
        await db.registrationForm.delete({
            where: { yearId },
        });

        revalidatePath(`/admin/rocniky/${yearId}`);
        revalidatePath("/registrace");

        return { success: true };
    } catch (error) {
        console.error("Failed to delete registration form:", error);
        return { error: "Nepodařilo se smazat formulář" };
    }
}
