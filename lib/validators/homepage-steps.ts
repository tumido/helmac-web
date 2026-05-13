import { z } from "zod";

export const createHomepageStepSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    description: z
        .string()
        .min(1, "Popis je povinný")
        .max(500, "Popis je příliš dlouhý"),
    icon: z.string().min(1, "Ikona je povinná"),
});

export const updateHomepageStepSchema = z.object({
    title: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý")
        .optional(),
    description: z
        .string()
        .min(1, "Popis je povinný")
        .max(500, "Popis je příliš dlouhý")
        .optional(),
    icon: z.string().min(1, "Ikona je povinná").optional(),
});

export type CreateHomepageStepInput = z.infer<
    typeof createHomepageStepSchema
>;
export type UpdateHomepageStepInput = z.infer<
    typeof updateHomepageStepSchema
>;
