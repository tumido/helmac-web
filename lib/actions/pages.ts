"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createPageSchema, updatePageSchema } from "@/lib/validators/page";

export type PageActionState = {
    error?: {
        slug?: string[];
        title?: string[];
        content?: string[];
        seoTitle?: string[];
        seoDesc?: string[];
        sortOrder?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createPage(
    yearId: string,
    prevState: PageActionState,
    formData: FormData
): Promise<PageActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        seoTitle: formData.get("seoTitle") || undefined,
        seoDesc: formData.get("seoDesc") || undefined,
        sortOrder: formData.get("sortOrder") || 0,
    };

    const validated = createPageSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if slug already exists for this year
        const existing = await db.page.findUnique({
            where: {
                yearId_slug: {
                    yearId,
                    slug: validated.data.slug,
                },
            },
        });

        if (existing) {
            return { error: { slug: ["Stranka s timto slugem jiz existuje"] } };
        }

        // Get max sort order
        const maxOrder = await db.page.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.page.create({
            data: {
                yearId,
                slug: validated.data.slug,
                title: validated.data.title,
                seoTitle: validated.data.seoTitle,
                seoDesc: validated.data.seoDesc,
                sortOrder: validated.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
                content: { sections: [] },
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}`);
    } catch (error) {
        console.error("Failed to create page:", error);
        return { error: { _form: ["Nepodarilo se vytvorit stranku"] } };
    }

    redirect(`/admin/rocniky/${yearId}`);
}

export async function updatePage(
    pageId: string,
    prevState: PageActionState,
    formData: FormData
): Promise<PageActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        seoTitle: formData.get("seoTitle") || undefined,
        seoDesc: formData.get("seoDesc") || undefined,
        sortOrder: formData.get("sortOrder"),
    };

    const validated = updatePageSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const page = await db.page.findUnique({ where: { id: pageId } });

        if (!page) {
            return { error: { _form: ["Stranka nenalezena"] } };
        }

        // Check if slug conflicts with another page
        if (validated.data.slug && validated.data.slug !== page.slug) {
            const existing = await db.page.findUnique({
                where: {
                    yearId_slug: {
                        yearId: page.yearId,
                        slug: validated.data.slug,
                    },
                },
            });

            if (existing) {
                return { error: { slug: ["Stranka s timto slugem jiz existuje"] } };
            }
        }

        await db.page.update({
            where: { id: pageId },
            data: {
                slug: validated.data.slug,
                title: validated.data.title,
                seoTitle: validated.data.seoTitle,
                seoDesc: validated.data.seoDesc,
                sortOrder: validated.data.sortOrder,
            },
        });

        revalidatePath(`/admin/rocniky/${page.yearId}`);
        revalidatePath(`/admin/rocniky/${page.yearId}/stranky/${pageId}`);
    } catch (error) {
        console.error("Failed to update page:", error);
        return { error: { _form: ["Nepodarilo se upravit stranku"] } };
    }

    return { success: true };
}

export async function updatePageContent(
    pageId: string,
    content: Prisma.InputJsonValue
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const page = await db.page.findUnique({ where: { id: pageId } });

        if (!page) {
            return { error: "Stranka nenalezena" };
        }

        await db.page.update({
            where: { id: pageId },
            data: { content },
        });

        revalidatePath(`/admin/rocniky/${page.yearId}`);
        revalidatePath(`/admin/rocniky/${page.yearId}/stranky/${pageId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update page content:", error);
        return { error: "Nepodarilo se ulozit obsah stranky" };
    }
}

export async function publishPage(pageId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const page = await db.page.update({
            where: { id: pageId },
            data: { isPublished: true },
        });

        revalidatePath(`/admin/rocniky/${page.yearId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to publish page:", error);
        return { error: "Nepodarilo se publikovat stranku" };
    }
}

export async function unpublishPage(pageId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const page = await db.page.update({
            where: { id: pageId },
            data: { isPublished: false },
        });

        revalidatePath(`/admin/rocniky/${page.yearId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to unpublish page:", error);
        return { error: "Nepodarilo se skryt stranku" };
    }
}

export async function reorderPages(
    yearId: string,
    pageIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.$transaction(
            pageIds.map((id, index) =>
                db.page.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${yearId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder pages:", error);
        return { error: "Nepodarilo se zmenit poradi stranek" };
    }
}

export async function deletePage(pageId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        const page = await db.page.delete({
            where: { id: pageId },
        });

        revalidatePath(`/admin/rocniky/${page.yearId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete page:", error);
        return { error: "Nepodarilo se smazat stranku" };
    }
}
