import { z } from "zod";
import { contentBlocksSchema } from "./content-blocks";

export const createInfoSectionSchema = z.object({
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    subtitle: z.string().max(200, "Podtitulek je prilis dlouhy").optional(),
    icon: z.string().optional(),
    content: z
        .string()
        .min(2, "Obsah je povinny")
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

export const updateInfoSectionSchema = z.object({
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy")
        .optional(),
    subtitle: z.string().max(200, "Podtitulek je prilis dlouhy").optional(),
    icon: z.string().optional(),
    content: z
        .string()
        .min(2, "Obsah je povinny")
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

export type CreateInfoSectionInput = z.infer<typeof createInfoSectionSchema>;
export type UpdateInfoSectionInput = z.infer<typeof updateInfoSectionSchema>;
