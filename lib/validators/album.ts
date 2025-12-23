import { z } from "zod";

export const createAlbumSchema = z.object({
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
    description: z.string().max(1000, "Popis je prilis dlouhy").optional(),
    coverImage: z.string().url("Neplatna URL obrazku").optional().or(z.literal("")),
    isPublished: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const createImageSchema = z.object({
    url: z.string().url("Neplatna URL obrazku"),
    thumbnailUrl: z.string().url("Neplatna URL nahledu").optional().or(z.literal("")),
    title: z.string().max(200, "Nazev je prilis dlouhy").optional(),
    description: z.string().max(1000, "Popis je prilis dlouhy").optional(),
    altText: z.string().max(200, "Alt text je prilis dlouhy").optional(),
    width: z.coerce.number().int().positive().optional(),
    height: z.coerce.number().int().positive().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateImageSchema = createImageSchema.partial();

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
