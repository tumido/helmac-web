import { z } from "zod";

export const createNewsSchema = z.object({
    slug: z
        .string()
        .min(1, "Slug je povinny")
        .max(100, "Slug je prilis dlouhy")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug muze obsahovat pouze mala pismena, cisla a pomlcky"
        ),
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    excerpt: z.string().max(500, "Perex je prilis dlouhy").optional(),
    content: z.string().min(1, "Obsah je povinny"),
    coverImage: z
        .string()
        .refine(
            (val) => val === "" || val.startsWith("/") || val.startsWith("http"),
            "Neplatna URL obrazku"
        )
        .optional(),
    isPublished: z.coerce.boolean().optional(),
    publishedAt: z.coerce.date().optional().nullable(),
});

export const updateNewsSchema = createNewsSchema.partial();

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
