"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import {
    createSectionSchema,
    updateSectionSchema,
    createSectionTypeSchema,
    updateSectionTypeSchema,
} from "@/lib/validators/sections";

// ============================================
// Section Actions
// ============================================

export type SectionActionState = {
    error?: {
        title?: string[];
        content?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createSection(
    sectionTypeId: string,
    prevState: SectionActionState,
    formData: FormData
): Promise<SectionActionState> {
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

    const validated = createSectionSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    let yearId: string;

    try {
        const sectionType = await db.sectionType.findUnique({
            where: { id: sectionTypeId },
            select: { yearId: true, slug: true },
        });

        if (!sectionType) {
            return { error: { _form: ["Typ sekce nenalezen"] } };
        }

        yearId = sectionType.yearId;

        const maxOrder = await db.section.aggregate({
            where: { sectionTypeId },
            _max: { sortOrder: true },
        });

        await db.section.create({
            data: {
                sectionTypeId,
                title: validated.data.title,
                subtitle: validated.data.subtitle ?? null,
                content: validated.data.content,
                showToc: validated.data.showToc ?? false,
                icon: validated.data.icon ?? null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/sekce`);
        revalidatePath(`/${sectionType.slug}`);
    } catch (error) {
        console.error("Failed to create section:", error);
        return { error: { _form: ["Nepodařilo se vytvořit sekci"] } };
    }

    redirect(`/admin/rocniky/${yearId}/sekce`);
}

export async function updateSection(
    sectionId: string,
    prevState: SectionActionState,
    formData: FormData
): Promise<SectionActionState> {
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

    const validated = updateSectionSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    let yearId: string;

    try {
        const section = await db.section.findUnique({
            where: { id: sectionId },
            select: {
                sectionType: {
                    select: { yearId: true, slug: true },
                },
            },
        });

        if (!section) {
            return { error: { _form: ["Sekce nenalezena"] } };
        }

        yearId = section.sectionType.yearId;

        await db.section.update({
            where: { id: sectionId },
            data: {
                title: validated.data.title,
                subtitle: validated.data.subtitle ?? null,
                content: validated.data.content,
                showToc: validated.data.showToc,
                icon: validated.data.icon ?? null,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/sekce`);
        revalidatePath(`/${section.sectionType.slug}`);
    } catch (error) {
        console.error("Failed to update section:", error);
        return { error: { _form: ["Nepodařilo se upravit sekci"] } };
    }

    redirect(`/admin/rocniky/${yearId}/sekce`);
}

export async function deleteSection(sectionId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const section = await db.section.findUnique({
            where: { id: sectionId },
            select: {
                sectionType: {
                    select: { yearId: true, slug: true },
                },
            },
        });

        await db.section.delete({
            where: { id: sectionId },
        });

        if (section) {
            revalidatePath(
                `/admin/rocniky/${section.sectionType.yearId}/sekce`
            );
            revalidatePath(`/${section.sectionType.slug}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to delete section:", error);
        return { error: "Nepodařilo se smazat sekci" };
    }
}

export async function reorderSections(
    sectionTypeId: string,
    sectionIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const sectionType = await db.sectionType.findUnique({
            where: { id: sectionTypeId },
            select: { yearId: true, slug: true },
        });

        await db.$transaction(
            sectionIds.map((id, index) =>
                db.section.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        if (sectionType) {
            revalidatePath(
                `/admin/rocniky/${sectionType.yearId}/sekce`
            );
            revalidatePath(`/${sectionType.slug}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to reorder sections:", error);
        return { error: "Nepodařilo se změnit pořadí sekcí" };
    }
}

export async function moveSection(
    sectionId: string,
    targetTypeId: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const [section, targetType] = await Promise.all([
            db.section.findUnique({
                where: { id: sectionId },
                select: {
                    sectionType: {
                        select: { yearId: true, slug: true },
                    },
                },
            }),
            db.sectionType.findUnique({
                where: { id: targetTypeId },
                select: { yearId: true, slug: true },
            }),
        ]);

        if (!section || !targetType) {
            return { error: "Sekce nebo cílový typ nenalezen" };
        }

        const maxOrder = await db.section.aggregate({
            where: { sectionTypeId: targetTypeId },
            _max: { sortOrder: true },
        });

        await db.section.update({
            where: { id: sectionId },
            data: {
                sectionTypeId: targetTypeId,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            },
        });

        const yearId = section.sectionType.yearId;
        revalidatePath(`/admin/rocniky/${yearId}/sekce`);
        revalidatePath(`/${section.sectionType.slug}`);
        revalidatePath(`/${targetType.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to move section:", error);
        return { error: "Nepodařilo se přesunout sekci" };
    }
}

// ============================================
// SectionType Actions
// ============================================

export type SectionTypeActionState = {
    error?: {
        label?: string[];
        slug?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createSectionType(
    yearId: string,
    prevState: SectionTypeActionState,
    formData: FormData
): Promise<SectionTypeActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        label: formData.get("label"),
        slug: formData.get("slug"),
        icon: formData.get("icon") || undefined,
        pageTitle: formData.get("pageTitle") || undefined,
        pageSubtitle: formData.get("pageSubtitle") || undefined,
        metaTitle: formData.get("metaTitle") || undefined,
        metaDescription: formData.get("metaDescription") || undefined,
    };

    const validated = createSectionTypeSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const existing = await db.sectionType.findUnique({
            where: {
                yearId_slug: { yearId, slug: validated.data.slug },
            },
        });

        if (existing) {
            return {
                error: {
                    slug: ["Tento slug je již použitý v tomto ročníku"],
                },
            };
        }

        const maxOrder = await db.sectionType.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.sectionType.create({
            data: {
                yearId,
                label: validated.data.label,
                slug: validated.data.slug,
                icon: validated.data.icon ?? null,
                pageTitle: validated.data.pageTitle ?? null,
                pageSubtitle: validated.data.pageSubtitle ?? null,
                metaTitle: validated.data.metaTitle ?? null,
                metaDescription: validated.data.metaDescription ?? null,
                sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/sekce`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create section type:", error);
        return { error: { _form: ["Nepodařilo se vytvořit typ sekce"] } };
    }
}

export async function updateSectionType(
    typeId: string,
    prevState: SectionTypeActionState,
    formData: FormData
): Promise<SectionTypeActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        label: formData.get("label") || undefined,
        slug: formData.get("slug") || undefined,
        icon: formData.get("icon") || undefined,
        pageTitle: formData.get("pageTitle") || undefined,
        pageSubtitle: formData.get("pageSubtitle") || undefined,
        metaTitle: formData.get("metaTitle") || undefined,
        metaDescription: formData.get("metaDescription") || undefined,
    };

    const validated = updateSectionTypeSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const sectionType = await db.sectionType.findUnique({
            where: { id: typeId },
            select: { yearId: true, slug: true },
        });

        if (!sectionType) {
            return { error: { _form: ["Typ sekce nenalezen"] } };
        }

        if (
            validated.data.slug &&
            validated.data.slug !== sectionType.slug
        ) {
            const existing = await db.sectionType.findUnique({
                where: {
                    yearId_slug: {
                        yearId: sectionType.yearId,
                        slug: validated.data.slug,
                    },
                },
            });

            if (existing) {
                return {
                    error: {
                        slug: [
                            "Tento slug je již použitý v tomto ročníku",
                        ],
                    },
                };
            }
        }

        await db.sectionType.update({
            where: { id: typeId },
            data: {
                label: validated.data.label,
                slug: validated.data.slug,
                icon: validated.data.icon ?? null,
                pageTitle: validated.data.pageTitle ?? null,
                pageSubtitle: validated.data.pageSubtitle ?? null,
                metaTitle: validated.data.metaTitle ?? null,
                metaDescription: validated.data.metaDescription ?? null,
            },
        });

        revalidatePath(`/admin/rocniky/${sectionType.yearId}/sekce`);
        revalidatePath(`/${sectionType.slug}`);
        if (
            validated.data.slug &&
            validated.data.slug !== sectionType.slug
        ) {
            revalidatePath(`/${validated.data.slug}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to update section type:", error);
        return { error: { _form: ["Nepodařilo se upravit typ sekce"] } };
    }
}

export async function deleteSectionType(typeId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const sectionType = await db.sectionType.findUnique({
            where: { id: typeId },
            select: { yearId: true, slug: true },
        });

        await db.sectionType.delete({
            where: { id: typeId },
        });

        if (sectionType) {
            revalidatePath(
                `/admin/rocniky/${sectionType.yearId}/sekce`
            );
            revalidatePath(`/${sectionType.slug}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to delete section type:", error);
        return { error: "Nepodařilo se smazat typ sekce" };
    }
}

export async function reorderSectionTypes(
    yearId: string,
    typeIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.$transaction(
            typeIds.map((id, index) =>
                db.sectionType.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${yearId}/sekce`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder section types:", error);
        return { error: "Nepodařilo se změnit pořadí typů sekcí" };
    }
}
