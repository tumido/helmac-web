"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import {
    createAlbumSchema,
    updateAlbumSchema,
} from "@/lib/validators/album";
import { generateSlug } from "@/lib/utils/slugify";

export type AlbumActionState = {
    error?: {
        title?: string[];
        description?: string[];
        coverImage?: string[];
        externalUrl?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

// Album CRUD

export async function createAlbum(
    yearId: string,
    prevState: AlbumActionState,
    formData: FormData
): Promise<AlbumActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        coverImage: formData.get("coverImage") || undefined,
        externalUrl: formData.get("externalUrl"),
    };

    const validated = createAlbumSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const rawRedirectTo = formData.get("redirectTo") as string | null;
    const validatedRedirectTo = rawRedirectTo?.startsWith("/admin/") ? rawRedirectTo : "/admin/galerie";

    try {
        let slug = generateSlug(validated.data.title);

        const existingSlugs = await db.album.findMany({
            where: { yearId, slug: { startsWith: slug } },
            select: { slug: true },
        });

        if (existingSlugs.length > 0) {
            const slugSet = new Set(existingSlugs.map((a) => a.slug));
            if (slugSet.has(slug)) {
                let suffix = 2;
                while (slugSet.has(`${slug}-${suffix}`)) {
                    suffix++;
                }
                slug = `${slug}-${suffix}`;
            }
        }

        const maxOrder = await db.album.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.album.create({
            data: {
                yearId,
                slug,
                title: validated.data.title,
                description: validated.data.description,
                coverImage: validated.data.coverImage || null,
                externalUrl: validated.data.externalUrl,
                isPublished: true,
                sortOrder: validated.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath("/admin/galerie");
        revalidatePath("/galerie");
        if (validatedRedirectTo !== "/admin/galerie") {
            revalidatePath(validatedRedirectTo);
        }
    } catch (error) {
        console.error("Failed to create album:", error);
        return { error: { _form: ["Nepodařilo se vytvořit album"] } };
    }

    redirect(validatedRedirectTo);
}

export async function updateAlbum(
    albumId: string,
    prevState: AlbumActionState,
    formData: FormData
): Promise<AlbumActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        coverImage: formData.get("coverImage") || undefined,
        externalUrl: formData.get("externalUrl"),
    };

    const validated = updateAlbumSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const album = await db.album.findUnique({ where: { id: albumId } });

        if (!album) {
            return { error: { _form: ["Album nenalezeno"] } };
        }

        await db.album.update({
            where: { id: albumId },
            data: {
                title: validated.data.title,
                description: validated.data.description,
                coverImage: validated.data.coverImage || null,
                externalUrl: validated.data.externalUrl,
                isPublished: true,
            },
        });

        revalidatePath("/admin/galerie");
        revalidatePath(`/admin/galerie/${albumId}`);
        revalidatePath("/galerie");
    } catch (error) {
        console.error("Failed to update album:", error);
        return { error: { _form: ["Nepodařilo se upravit album"] } };
    }

    return { success: true };
}

export async function deleteAlbum(albumId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.album.delete({
            where: { id: albumId },
        });

        revalidatePath("/admin/galerie");
        revalidatePath("/galerie");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete album:", error);
        return { error: "Nepodařilo se smazat album" };
    }
}

// Bulk actions
export async function bulkDeleteAlbums(albumIds: string[]) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.album.deleteMany({
            where: { id: { in: albumIds } },
        });

        revalidatePath("/admin/galerie");
        revalidatePath("/galerie");
        return { success: true, count: albumIds.length };
    } catch (error) {
        console.error("Failed to bulk delete albums:", error);
        return { error: "Nepodařilo se smazat alba" };
    }
}
