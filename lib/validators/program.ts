import { z } from "zod";

// ============================================
// Program Day Schemas
// ============================================

export const createProgramDaySchema = z.object({
    date: z.coerce.date({ message: "Datum je povinne" }),
    label: z
        .string()
        .min(1, "Popisek je povinny")
        .max(50, "Popisek je prilis dlouhy"),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateProgramDaySchema = createProgramDaySchema.partial();

export type CreateProgramDayInput = z.infer<typeof createProgramDaySchema>;
export type UpdateProgramDayInput = z.infer<typeof updateProgramDaySchema>;

// ============================================
// Program Event Schemas
// ============================================

export const createProgramEventSchema = z.object({
    startTime: z
        .string()
        .min(1, "Cas zacatku je povinny")
        .regex(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Neplatny format casu (HH:MM)"
        ),
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    description: z
        .string()
        .min(1, "Popis je povinny")
        .max(2000, "Popis je prilis dlouhy"),
    location: z
        .string()
        .min(1, "Misto je povinne")
        .max(200, "Misto je prilis dlouhe"),
    imageUrl: z
        .string()
        .refine(
            (val) => val === "" || val.startsWith("/") || val.startsWith("http"),
            "Neplatna URL obrazku"
        )
        .optional(),
    tags: z.array(z.string()).default([]),
    storyContent: z.any().optional(),
    isPublished: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateProgramEventSchema = createProgramEventSchema.partial();

export type CreateProgramEventInput = z.infer<typeof createProgramEventSchema>;
export type UpdateProgramEventInput = z.infer<typeof updateProgramEventSchema>;
