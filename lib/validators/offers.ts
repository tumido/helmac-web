import { z } from "zod";
import { contentBlocksSchema } from "./content-blocks";

export const createOfferSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    subtitle: z.string().max(200, "Podtitulek je příliš dlouhý").optional(),
    content: z
        .string()
        .min(2, "Obsah je povinný")
        .transform((val, ctx) => {
            try {
                return JSON.parse(val);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: "Neplatný formát obsahu",
                });
                return z.NEVER;
            }
        })
        .pipe(contentBlocksSchema),
    showToc: z.coerce.boolean().optional(),
});

export const updateOfferSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý")
        .optional(),
    subtitle: z.string().max(200, "Podtitulek je příliš dlouhý").optional(),
    content: z
        .string()
        .min(2, "Obsah je povinný")
        .transform((val, ctx) => {
            try {
                return JSON.parse(val);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: "Neplatný formát obsahu",
                });
                return z.NEVER;
            }
        })
        .pipe(contentBlocksSchema)
        .optional(),
    showToc: z.coerce.boolean().optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
