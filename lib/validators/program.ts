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

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const actionButtonSchema = z.object({
    label: z.string().min(1),
    url: z.string().min(1),
    variant: z
        .enum(["contained", "outlined", "text"])
        .optional(),
});

export const createProgramEventSchema = z
    .object({
        startTime: z
            .string()
            .min(1, "Čas začátku je povinný")
            .regex(timeRegex, "Neplatný formát času (HH:MM)"),
        endTime: z
            .string()
            .regex(timeRegex, "Neplatný formát času (HH:MM)")
            .optional()
            .or(z.literal("")),
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
            .optional(),
        tags: z.array(z.string()).default([]),
        storyContent: z.any().optional(),
        actionButtons: z
            .array(actionButtonSchema)
            .optional(),
    })
    .refine(
        (data) => {
            if (!data.endTime || data.endTime === "") return true;
            return data.endTime > data.startTime;
        },
        {
            message: "Čas konce musí být po začátku",
            path: ["endTime"],
        }
    );

export const updateProgramEventSchema = z
    .object({
        startTime: z
            .string()
            .min(1, "Čas začátku je povinný")
            .regex(timeRegex, "Neplatný formát času (HH:MM)")
            .optional(),
        endTime: z
            .string()
            .regex(timeRegex, "Neplatný formát času (HH:MM)")
            .optional()
            .or(z.literal("")),
        title: z
            .string()
            .min(1, "Název je povinný")
            .max(200, "Název je příliš dlouhý")
            .optional(),
        description: z
            .string()
            .min(1, "Popis je povinný")
            .max(2000, "Popis je příliš dlouhý")
            .optional(),
        location: z
            .string()
            .min(1, "Místo je povinné")
            .max(200, "Místo je příliš dlouhé")
            .optional(),
        imageUrl: z
            .string()
            .optional(),
        tags: z.array(z.string()).default([]),
        storyContent: z.any().optional(),
        actionButtons: z
            .array(actionButtonSchema)
            .optional(),
    })
    .refine(
        (data) => {
            if (!data.startTime || !data.endTime || data.endTime === "")
                return true;
            return data.endTime > data.startTime;
        },
        {
            message: "Čas konce musí být po začátku",
            path: ["endTime"],
        }
    );

export type CreateProgramEventInput = z.infer<typeof createProgramEventSchema>;
export type UpdateProgramEventInput = z.infer<typeof updateProgramEventSchema>;
