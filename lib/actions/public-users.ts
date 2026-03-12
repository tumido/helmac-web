"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function deletePublicUser(userId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const user = await db.publicUser.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { error: "Účastník nenalezen" };
        }

        await db.publicUser.delete({
            where: { id: userId },
        });

        revalidatePath("/admin/ucastnici");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete public user:", error);
        return { error: "Nepodařilo se smazat účastníka" };
    }
}
