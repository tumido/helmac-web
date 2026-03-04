"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveRegistrationFormSchema } from "@/lib/validators/registration-form";
import type { FormField } from "@/lib/types/registration-form";

interface SaveFormResult {
    success?: boolean;
    error?: string;
}

export async function saveRegistrationForm(yearId: string, fields: FormField[]): Promise<SaveFormResult> {
    await requireAdmin();

    const validated = saveRegistrationFormSchema.safeParse({ fields });

    if (!validated.success) {
        const fieldErrors = validated.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors).flat()[0];
        return { error: firstError || "Neplatná data formuláře" };
    }

    try {
        await db.registrationForm.upsert({
            where: { yearId },
            create: {
                yearId,
                fields: validated.data.fields as unknown as object[],
            },
            update: {
                fields: validated.data.fields as unknown as object[],
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
