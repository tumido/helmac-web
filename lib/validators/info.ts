import { z } from "zod";

export const createInfoSectionSchema = z.object({
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    content: z.string().min(1, "Obsah je povinny"),
});

export const updateInfoSectionSchema = createInfoSectionSchema.partial();

export type CreateInfoSectionInput = z.infer<typeof createInfoSectionSchema>;
export type UpdateInfoSectionInput = z.infer<typeof updateInfoSectionSchema>;
