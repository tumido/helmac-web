"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
    createAlbumSchema,
    updateAlbumSchema,
    createImageSchema,
    updateImageSchema,
} from "@/lib/validators/album";

export type AlbumActionState = {
    error?: {
        slug?: string[];
        title?: string[];
        description?: string[];
        coverImage?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export type ImageActionState = {
    error?: {
        url?: string[];
        thumbnailUrl?: string[];
        title?: string[];
        description?: string[];
        altText?: string[];
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
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        coverImage: formData.get("coverImage") || undefined,
    };

    const validated = createAlbumSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const existing = await db.album.findUnique({
            where: {
                yearId_slug: {
                    yearId,
                    slug: validated.data.slug,
                },
            },
        });

        if (existing) {
            return { error: { slug: ["Album s tímto slugem již existuje"] } };
        }

        const maxOrder = await db.album.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.album.create({
            data: {
                yearId,
                slug: validated.data.slug,
                title: validated.data.title,
                description: validated.data.description,
                coverImage: validated.data.coverImage || null,
                isPublished: true,
                sortOrder: validated.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath("/admin/galerie");
        revalidatePath("/galerie");
    } catch (error) {
        console.error("Failed to create album:", error);
        return { error: { _form: ["Nepodařilo se vytvořit album"] } };
    }

    redirect("/admin/galerie");
}

export async function updateAlbum(
    albumId: string,
    prevState: AlbumActionState,
    formData: FormData
): Promise<AlbumActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        slug: formData.get("slug"),
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        coverImage: formData.get("coverImage") || undefined,
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

        if (validated.data.slug && validated.data.slug !== album.slug) {
            const existing = await db.album.findUnique({
                where: {
                    yearId_slug: {
                        yearId: album.yearId,
                        slug: validated.data.slug,
                    },
                },
            });

            if (existing) {
                return { error: { slug: ["Album s tímto slugem již existuje"] } };
            }
        }

        await db.album.update({
            where: { id: albumId },
            data: {
                slug: validated.data.slug,
                title: validated.data.title,
                description: validated.data.description,
                coverImage: validated.data.coverImage || null,
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
        await requireAdmin();
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
        await requireAdmin();
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

// Image CRUD

export async function addImage(
    albumId: string,
    prevState: ImageActionState,
    formData: FormData
): Promise<ImageActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        url: formData.get("url"),
        thumbnailUrl: formData.get("thumbnailUrl") || undefined,
        title: formData.get("title") || undefined,
        description: formData.get("description") || undefined,
        altText: formData.get("altText") || undefined,
        width: formData.get("width") || undefined,
        height: formData.get("height") || undefined,
    };

    const validated = createImageSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const maxOrder = await db.image.aggregate({
            where: { albumId },
            _max: { sortOrder: true },
        });

        await db.image.create({
            data: {
                albumId,
                url: validated.data.url,
                thumbnailUrl: validated.data.thumbnailUrl || null,
                title: validated.data.title,
                description: validated.data.description,
                altText: validated.data.altText,
                width: validated.data.width,
                height: validated.data.height,
                sortOrder: validated.data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath(`/admin/galerie/${albumId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to add image:", error);
        return { error: { _form: ["Nepodařilo se přidat obrázek"] } };
    }
}

export async function updateImage(
    imageId: string,
    prevState: ImageActionState,
    formData: FormData
): Promise<ImageActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        url: formData.get("url"),
        thumbnailUrl: formData.get("thumbnailUrl") || undefined,
        title: formData.get("title") || undefined,
        description: formData.get("description") || undefined,
        altText: formData.get("altText") || undefined,
    };

    const validated = updateImageSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const image = await db.image.update({
            where: { id: imageId },
            data: {
                url: validated.data.url,
                thumbnailUrl: validated.data.thumbnailUrl || null,
                title: validated.data.title,
                description: validated.data.description,
                altText: validated.data.altText,
            },
        });

        revalidatePath(`/admin/galerie/${image.albumId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update image:", error);
        return { error: { _form: ["Nepodařilo se upravit obrázek"] } };
    }
}

export async function deleteImage(imageId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const image = await db.image.delete({
            where: { id: imageId },
        });

        revalidatePath(`/admin/galerie/${image.albumId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete image:", error);
        return { error: "Nepodařilo se smazat obrázek" };
    }
}

export async function reorderImages(
    albumId: string,
    imageIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.$transaction(
            imageIds.map((id, index) =>
                db.image.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/galerie/${albumId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder images:", error);
        return { error: "Nepodařilo se změnit pořadí obrázků" };
    }
}
