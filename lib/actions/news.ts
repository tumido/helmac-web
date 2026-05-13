"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireEditor } from "@/lib/auth";
import { createNewsSchema, updateNewsSchema } from "@/lib/validators/news";
import { generateSlug } from "@/lib/utils/slugify";

export type NewsActionState = {
    error?: {
        title?: string[];
        content?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createNews(
    yearId: string,
    prevState: NewsActionState,
    formData: FormData
): Promise<NewsActionState> {
    let session;
    try {
        await requireEditor();
        session = await auth();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    if (!session?.user?.id) {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const actionButtonsRaw = formData.get("actionButtons") as string | null;
    let actionButtons;
    try {
        actionButtons = actionButtonsRaw ? JSON.parse(actionButtonsRaw) : [];
    } catch {
        actionButtons = [];
    }

    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
        actionButtons,
    };

    const validated = createNewsSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const rawRedirectTo = formData.get("redirectTo") as string | null;
    const validatedRedirectTo = rawRedirectTo?.startsWith("/admin/") ? rawRedirectTo : "/admin/novinky";

    try {
        let slug = generateSlug(validated.data.title);

        const existing = await db.news.findUnique({
            where: {
                yearId_slug: { yearId, slug },
            },
        });

        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        await db.news.create({
            data: {
                yearId,
                authorId: session.user.id,
                slug,
                title: validated.data.title,
                content: validated.data.content,
                actionButtons: validated.data.actionButtons ?? [],
                isPublished: true,
                publishedAt: new Date(),
            },
        });

        revalidatePath("/admin/novinky");
        revalidatePath(`/admin/rocniky/${yearId}`);
        if (validatedRedirectTo !== "/admin/novinky") {
            revalidatePath(validatedRedirectTo);
        }
    } catch (error) {
        console.error("Failed to create news:", error);
        return { error: { _form: ["Nepodařilo se vytvořit novinku"] } };
    }

    redirect(validatedRedirectTo);
}

export async function updateNews(
    newsId: string,
    prevState: NewsActionState,
    formData: FormData
): Promise<NewsActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const actionButtonsRaw = formData.get("actionButtons") as string | null;
    let actionButtons;
    try {
        actionButtons = actionButtonsRaw ? JSON.parse(actionButtonsRaw) : undefined;
    } catch {
        actionButtons = undefined;
    }

    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
        actionButtons,
    };

    const validated = updateNewsSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const rawRedirectTo = formData.get("redirectTo") as string | null;
    const validatedRedirectTo = rawRedirectTo?.startsWith("/admin/") ? rawRedirectTo : "/admin/novinky";

    try {
        const news = await db.news.findUnique({ where: { id: newsId } });

        if (!news) {
            return { error: { _form: ["Novinka nenalezena"] } };
        }

        await db.news.update({
            where: { id: newsId },
            data: {
                title: validated.data.title,
                content: validated.data.content,
                actionButtons: validated.data.actionButtons,
                isPublished: true,
                publishedAt: news.publishedAt ?? new Date(),
            },
        });

        revalidatePath("/admin/novinky");
        revalidatePath(`/admin/novinky/${newsId}`);
        if (validatedRedirectTo !== "/admin/novinky") {
            revalidatePath(validatedRedirectTo);
        }
    } catch (error) {
        console.error("Failed to update news:", error);
        return { error: { _form: ["Nepodařilo se upravit novinku"] } };
    }

    redirect(validatedRedirectTo);
}

export async function deleteNews(newsId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.news.delete({
            where: { id: newsId },
        });

        revalidatePath("/admin/novinky");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete news:", error);
        return { error: "Nepodařilo se smazat novinku" };
    }
}
