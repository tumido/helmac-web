import { z } from "zod";

export const createPageSchema = z.object({
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
    content: z.any().optional(),
    seoTitle: z.string().max(70, "SEO titulek je prilis dlouhy").optional(),
    seoDesc: z.string().max(160, "SEO popis je prilis dlouhy").optional(),
    isPublished: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updatePageSchema = createPageSchema.partial();

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
