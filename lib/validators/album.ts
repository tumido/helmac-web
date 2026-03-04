import { z } from "zod";

export const createAlbumSchema = z.object({
    slug: z
        .string()
        .min(1, "Slug je povinný")
        .max(100, "Slug je příliš dlouhý")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug může obsahovat pouze malá písmena, čísla a pomlčky"
        ),
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    description: z.string().max(1000, "Popis je příliš dlouhý").optional(),
    coverImage: z
        .string()
        .refine(
            (val) => val === "" || val.startsWith("/") || val.startsWith("http"),
            "Neplatná URL obrázku"
        )
        .optional(),
    isPublished: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const createImageSchema = z.object({
    url: z
        .string()
        .min(1, "URL obrázku je povinná")
        .refine(
            (val) => val.startsWith("/") || val.startsWith("http"),
            "Neplatná URL obrázku"
        ),
    thumbnailUrl: z
        .string()
        .refine(
            (val) => val === "" || val.startsWith("/") || val.startsWith("http"),
            "Neplatná URL náhledu"
        )
        .optional(),
    title: z.string().max(200, "Název je příliš dlouhý").optional(),
    description: z.string().max(1000, "Popis je příliš dlouhý").optional(),
    altText: z.string().max(200, "Alt text je příliš dlouhý").optional(),
    width: z.coerce.number().int().positive().optional(),
    height: z.coerce.number().int().positive().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateImageSchema = createImageSchema.partial();

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
