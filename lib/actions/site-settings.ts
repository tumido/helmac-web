"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function updateGdprContent(content: string) {
    await requireAdmin();

    try {
        await db.siteSetting.upsert({
            where: { key: "gdpr" },
            update: { value: content },
            create: { key: "gdpr", value: content },
        });

        revalidatePath("/admin/nastaveni/gdpr");
        revalidatePath("/gdpr");

        return { success: true };
    } catch {
        return { error: "Nepodařilo se uložit GDPR obsah" };
    }
}
