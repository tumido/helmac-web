import { z } from "zod";

export const createAlbumSchema = z.object({
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
    externalUrl: z
        .string()
        .min(1, "Odkaz je povinný")
        .url("Neplatná URL adresa"),
    isPublished: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
