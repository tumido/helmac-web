import { z } from "zod";

export const createOfferSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    content: z.string().min(1, "Obsah je povinný"),
});

export const updateOfferSchema = createOfferSchema.partial();

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
