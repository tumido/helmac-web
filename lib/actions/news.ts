"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireAdmin } from "@/lib/auth";
import { createNewsSchema, updateNewsSchema } from "@/lib/validators/news";

export type NewsActionState = {
    error?: {
        slug?: string[];
        title?: string[];
        excerpt?: string[];
        content?: string[];
        coverImage?: string[];
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
        await requireAdmin();
        session = await auth();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    if (!session?.user?.id) {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt") || undefined,
        content: formData.get("content"),
        coverImage: formData.get("coverImage") || undefined,
    };

    const validated = createNewsSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if slug already exists for this year
        const existing = await db.news.findUnique({
            where: {
                yearId_slug: {
                    yearId,
                    slug: validated.data.slug,
                },
            },
        });

        if (existing) {
            return { error: { slug: ["Novinka s tímto slugem již existuje"] } };
        }

        await db.news.create({
            data: {
                yearId,
                authorId: session.user.id,
                slug: validated.data.slug,
                title: validated.data.title,
                excerpt: validated.data.excerpt,
                content: validated.data.content,
                coverImage: validated.data.coverImage || null,
                isPublished: true,
                publishedAt: new Date(),
            },
        });

        revalidatePath("/admin/novinky");
        revalidatePath(`/admin/rocniky/${yearId}`);
    } catch (error) {
        console.error("Failed to create news:", error);
        return { error: { _form: ["Nepodařilo se vytvořit novinku"] } };
    }

    redirect("/admin/novinky");
}

export async function updateNews(
    newsId: string,
    prevState: NewsActionState,
    formData: FormData
): Promise<NewsActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        excerpt: formData.get("excerpt") || undefined,
        content: formData.get("content"),
        coverImage: formData.get("coverImage") || undefined,
    };

    const validated = updateNewsSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const news = await db.news.findUnique({ where: { id: newsId } });

        if (!news) {
            return { error: { _form: ["Novinka nenalezena"] } };
        }

        // Check if slug conflicts with another news
        if (validated.data.slug && validated.data.slug !== news.slug) {
            const existing = await db.news.findUnique({
                where: {
                    yearId_slug: {
                        yearId: news.yearId,
                        slug: validated.data.slug,
                    },
                },
            });

            if (existing) {
                return { error: { slug: ["Novinka s tímto slugem již existuje"] } };
            }
        }

        await db.news.update({
            where: { id: newsId },
            data: {
                slug: validated.data.slug,
                title: validated.data.title,
                excerpt: validated.data.excerpt,
                content: validated.data.content,
                coverImage: validated.data.coverImage || null,
                isPublished: true,
                publishedAt: news.publishedAt ?? new Date(),
            },
        });

        revalidatePath("/admin/novinky");
        revalidatePath(`/admin/novinky/${newsId}`);
    } catch (error) {
        console.error("Failed to update news:", error);
        return { error: { _form: ["Nepodařilo se upravit novinku"] } };
    }

    redirect("/admin/novinky");
}

export async function deleteNews(newsId: string) {
    try {
        await requireAdmin();
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

// Bulk actions
export async function bulkDeleteNews(newsIds: string[]) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.news.deleteMany({
            where: { id: { in: newsIds } },
        });

        revalidatePath("/admin/novinky");
        return { success: true, count: newsIds.length };
    } catch (error) {
        console.error("Failed to bulk delete news:", error);
        return { error: "Nepodařilo se smazat novinky" };
    }
}
