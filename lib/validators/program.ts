import { z } from "zod";

// ============================================
// Program Day Schemas
// ============================================

export const createProgramDaySchema = z.object({
    date: z.coerce.date({ message: "Datum je povinné" }),
    label: z
        .string()
        .min(1, "Popisek je povinný")
        .max(50, "Popisek je příliš dlouhý"),
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
        .min(1, "Čas začátku je povinný")
        .regex(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Neplatný formát času (HH:MM)"
        ),
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    description: z
        .string()
        .min(1, "Popis je povinný")
        .max(2000, "Popis je příliš dlouhý"),
    location: z
        .string()
        .min(1, "Místo je povinné")
        .max(200, "Místo je příliš dlouhé"),
    imageUrl: z
        .string()
        .refine(
            (val) => val === "" || val.startsWith("/") || val.startsWith("http"),
            "Neplatná URL obrázku"
        )
        .optional(),
    tags: z.array(z.string()).default([]),
    storyContent: z.any().optional(),
});

export const updateProgramEventSchema = createProgramEventSchema.partial();

export type CreateProgramEventInput = z.infer<typeof createProgramEventSchema>;
export type UpdateProgramEventInput = z.infer<typeof updateProgramEventSchema>;
