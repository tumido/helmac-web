"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { RegistrationFormData } from "@/lib/types/registration-form";
import type { Prisma } from "@prisma/client";

export async function saveFormPreview(yearId: string, data: RegistrationFormData): Promise<{ token: string }> {
    await requireAdmin();

    const jsonData = JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;

    const preview = await db.formPreview.upsert({
        where: { yearId },
        create: {
            yearId,
            data: jsonData,
        },
        update: {
            data: jsonData,
        },
    });

    return { token: preview.token };
}
