"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { createOfferSchema, updateOfferSchema } from "@/lib/validators/offers";

export type OfferActionState = {
    error?: {
        title?: string[];
        content?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createOffer(
    yearId: string,
    prevState: OfferActionState,
    formData: FormData
): Promise<OfferActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        content: formData.get("content"),
        showToc: formData.get("showToc"),
        icon: formData.get("icon") || undefined,
    };

    const validated = createOfferSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Get max sortOrder for auto-ordering
        const maxOrder = await db.offer.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.offer.create({
            data: {
                yearId,
                title: validated.data.title,
                subtitle: validated.data.subtitle ?? null,
                content: validated.data.content,
                showToc: validated.data.showToc ?? false,
                icon: validated.data.icon ?? null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/nabidka`);
        revalidatePath("/co-nabizime");
    } catch (error) {
        console.error("Failed to create offer:", error);
        return { error: { _form: ["Nepodařilo se vytvořit nabídku"] } };
    }

    redirect(`/admin/rocniky/${yearId}/nabidka`);
}

export async function updateOffer(
    offerId: string,
    prevState: OfferActionState,
    formData: FormData
): Promise<OfferActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        content: formData.get("content"),
        showToc: formData.get("showToc"),
        icon: formData.get("icon") || undefined,
    };

    const validated = updateOfferSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    let yearId: string;

    try {
        const offer = await db.offer.findUnique({
            where: { id: offerId },
            select: { yearId: true },
        });

        if (!offer) {
            return { error: { _form: ["Nabídka nenalezena"] } };
        }

        yearId = offer.yearId;

        await db.offer.update({
            where: { id: offerId },
            data: {
                title: validated.data.title,
                subtitle: validated.data.subtitle ?? null,
                content: validated.data.content,
                showToc: validated.data.showToc,
                icon: validated.data.icon ?? null,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/nabidka`);
        revalidatePath("/co-nabizime");
    } catch (error) {
        console.error("Failed to update offer:", error);
        return { error: { _form: ["Nepodařilo se upravit nabídku"] } };
    }

    redirect(`/admin/rocniky/${yearId}/nabidka`);
}

export async function deleteOffer(offerId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.offer.delete({
            where: { id: offerId },
        });

        revalidatePath("/co-nabizime");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete offer:", error);
        return { error: "Nepodařilo se smazat nabídku" };
    }
}

export async function reorderOffers(
    yearId: string,
    offerIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.$transaction(
            offerIds.map((id, index) =>
                db.offer.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${yearId}/nabidka`);
        revalidatePath("/co-nabizime");
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder offers:", error);
        return { error: "Nepodařilo se změnit pořadí nabídek" };
    }
}
