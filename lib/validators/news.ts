import { z } from "zod";

const actionButtonSchema = z.object({
    label: z.string().min(1),
    url: z.string().min(1),
    variant: z.enum(["contained", "outlined", "text"]).optional(),
});

export const createNewsSchema = z.object({
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    content: z.string().min(1, "Obsah je povinny"),
    actionButtons: z.array(actionButtonSchema).optional(),
    isPublished: z.coerce.boolean().optional(),
    publishedAt: z.coerce.date().optional().nullable(),
});

export const updateNewsSchema = createNewsSchema.partial();

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
