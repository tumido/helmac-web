import { z } from "zod";

const conditionRuleSchema = z.object({
    type: z.literal("field_value"),
    fieldId: z.string().min(1).optional(),
    operator: z.enum(["equals", "not_equals", "is_set", "is_not_set"]).optional(),
    value: z.string().optional(),
    connector: z.enum(["AND", "OR"]).optional(),
});

const formConditionSchema = z.object({
    id: z.string().min(1),
    name: z.string().default(""),
    rules: z.array(conditionRuleSchema),
});

export const emailConditionalSectionSchema = z.object({
    id: z.string().min(1),
    condition: formConditionSchema,
    body: z.string(),
    sortOrder: z.number().int(),
});

export const emailConditionalSectionsSchema = z.array(emailConditionalSectionSchema);

export function parseEmailConditionalSectionsJson(raw: unknown) {
    if (raw === undefined || raw === null || raw === "") {
        return emailConditionalSectionsSchema.parse([]);
    }
    let parsed: unknown = raw;
    if (typeof raw === "string") {
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error("Neplatný formát JSON pro podmíněné sekce");
        }
    }
    return emailConditionalSectionsSchema.parse(parsed);
}
