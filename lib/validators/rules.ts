import { z } from "zod";

export const createRuleSchema = z.object({
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    icon: z.string().optional(),
    content: z.string().min(1, "Obsah je povinny"),
    showToc: z.coerce.boolean().optional(),
});

export const updateRuleSchema = createRuleSchema.partial();

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
