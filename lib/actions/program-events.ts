"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import {
    createProgramEventSchema,
    updateProgramEventSchema,
} from "@/lib/validators/program";
import { Prisma } from "@prisma/client";

export type ProgramEventActionState = {
    error?: {
        startTime?: string[];
        title?: string[];
        description?: string[];
        location?: string[];
        imageUrl?: string[];
        tags?: string[];
        storyContent?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createProgramEvent(
    dayId: string,
    prevState: ProgramEventActionState,
    formData: FormData
): Promise<ProgramEventActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    // Parse tags from comma-separated string or JSON array
    let tags: string[] = [];
    const tagsRaw = formData.get("tags");
    if (tagsRaw) {
        try {
            tags = JSON.parse(tagsRaw as string);
        } catch {
            tags = (tagsRaw as string)
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
        }
    }

    const rawData = {
        startTime: formData.get("startTime"),
        title: formData.get("title"),
        description: formData.get("description"),
        location: formData.get("location"),
        imageUrl: formData.get("imageUrl") || undefined,
        tags,
    };

    const validated = createProgramEventSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const day = await db.programDay.findUnique({
            where: { id: dayId },
            select: { yearId: true },
        });

        if (!day) {
            return { error: { _form: ["Den programu nenalezen"] } };
        }

        const maxOrder = await db.programEvent.aggregate({
            where: { dayId },
            _max: { sortOrder: true },
        });

        await db.programEvent.create({
            data: {
                dayId,
                startTime: validated.data.startTime,
                title: validated.data.title,
                description: validated.data.description,
                location: validated.data.location,
                imageUrl: validated.data.imageUrl || null,
                tags: validated.data.tags,
                isPublished: true,
                sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${day.yearId}/program/${dayId}`);
        revalidatePath("/program");
    } catch (error) {
        console.error("Failed to create program event:", error);
        return { error: { _form: ["Nepodařilo se vytvořit událost"] } };
    }

    const yearId = formData.get("yearId");
    redirect(`/admin/rocniky/${yearId}/program/${dayId}`);
}

export async function updateProgramEvent(
    eventId: string,
    prevState: ProgramEventActionState,
    formData: FormData
): Promise<ProgramEventActionState> {
    try {
        await requireEditor();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    // Parse tags
    let tags: string[] = [];
    const tagsRaw = formData.get("tags");
    if (tagsRaw) {
        try {
            tags = JSON.parse(tagsRaw as string);
        } catch {
            tags = (tagsRaw as string)
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
        }
    }

    const rawData = {
        startTime: formData.get("startTime"),
        title: formData.get("title"),
        description: formData.get("description"),
        location: formData.get("location"),
        imageUrl: formData.get("imageUrl") || undefined,
        tags,
    };

    const validated = updateProgramEventSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const event = await db.programEvent.findUnique({
        where: { id: eventId },
        include: { day: { select: { yearId: true } } },
    });

    if (!event) {
        return { error: { _form: ["Událost nenalezena"] } };
    }

    try {
        await db.programEvent.update({
            where: { id: eventId },
            data: {
                startTime: validated.data.startTime,
                title: validated.data.title,
                description: validated.data.description,
                location: validated.data.location,
                imageUrl: validated.data.imageUrl || null,
                tags: validated.data.tags,
                isPublished: true,
            },
        });

        revalidatePath(
            `/admin/rocniky/${event.day.yearId}/program/${event.dayId}`
        );
        revalidatePath(
            `/admin/rocniky/${event.day.yearId}/program/${event.dayId}/${eventId}`
        );
        revalidatePath("/program");
    } catch (error) {
        console.error("Failed to update program event:", error);
        return { error: { _form: ["Nepodařilo se upravit událost"] } };
    }

    redirect(`/admin/rocniky/${event.day.yearId}/program/${event.dayId}`);
}

export async function updateProgramEventStory(
    eventId: string,
    storyContent: Prisma.InputJsonValue
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const event = await db.programEvent.findUnique({
            where: { id: eventId },
            include: { day: { select: { yearId: true } } },
        });

        if (!event) {
            return { error: "Událost nenalezena" };
        }

        await db.programEvent.update({
            where: { id: eventId },
            data: { storyContent },
        });

        revalidatePath(
            `/admin/rocniky/${event.day.yearId}/program/${event.dayId}/${eventId}`
        );
        revalidatePath("/program");
        return { success: true };
    } catch (error) {
        console.error("Failed to update event story:", error);
        return { error: "Nepodařilo se uložit příběh události" };
    }
}

export async function deleteProgramEvent(eventId: string) {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const event = await db.programEvent.delete({
            where: { id: eventId },
            include: { day: { select: { yearId: true } } },
        });

        revalidatePath(
            `/admin/rocniky/${event.day.yearId}/program/${event.dayId}`
        );
        revalidatePath("/program");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete event:", error);
        return { error: "Nepodařilo se smazat událost" };
    }
}

export async function reorderProgramEvents(
    dayId: string,
    eventIds: string[]
): Promise<{ success?: boolean; error?: string }> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const day = await db.programDay.findUnique({
            where: { id: dayId },
            select: { yearId: true },
        });

        if (!day) {
            return { error: "Den programu nenalezen" };
        }

        await db.$transaction(
            eventIds.map((id, index) =>
                db.programEvent.update({
                    where: { id },
                    data: { sortOrder: index },
                })
            )
        );

        revalidatePath(`/admin/rocniky/${day.yearId}/program/${dayId}`);
        revalidatePath("/program");
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder events:", error);
        return { error: "Nepodařilo se změnit pořadí událostí" };
    }
}
