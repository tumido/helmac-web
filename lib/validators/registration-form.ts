import { z } from "zod";

const conditionRuleSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("field_value"),
        fieldId: z.string().min(1),
        operator: z.enum(["equals", "not_equals"]),
        value: z.string(),
    }),
    z.object({
        type: z.literal("capacity"),
        fieldId: z.string().min(1),
        value: z.string().min(1),
        maxCount: z.number().int().min(1),
    }),
]);

const formConditionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Název podmínky je povinný"),
    rules: z.array(conditionRuleSchema).min(1, "Podmínka musí mít alespoň jedno pravidlo"),
});

const inputFieldSchema = z.object({
    type: z.enum(["text", "email", "textarea", "number", "checkbox", "select", "radio", "date", "pricing_select"]),
    id: z.string().min(1),
    name: z.string().min(1),
    label: z.string().min(1, "Popisek je povinný"),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
    pricingId: z.string().optional(),
});

const pricedOptionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    prices: z.array(z.number()),
});

const pricingDefinitionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Název cenové skupiny je povinný"),
    priceTiers: z.array(z.string()),
    options: z.array(pricedOptionSchema).min(1, "Cenová skupina musí mít alespoň jednu možnost"),
});

const headingFieldSchema = z.object({
    type: z.literal("heading"),
    id: z.string().min(1),
    text: z.string().min(1, "Text nadpisu je povinný"),
});

const descriptionFieldSchema = z.object({
    type: z.literal("description"),
    id: z.string().min(1),
    text: z.string().min(1, "Text popisu je povinný"),
});

const formFieldSchema = z.discriminatedUnion("type", [
    inputFieldSchema,
    headingFieldSchema,
    descriptionFieldSchema,
]);

const conditionBlockSchema = z.object({
    type: z.literal("condition"),
    id: z.string().min(1),
    conditionId: z.string().min(1),
    children: z.array(formFieldSchema),
});

const formElementSchema = z.union([formFieldSchema, conditionBlockSchema]);

export const saveRegistrationFormSchema = z.object({
    conditions: z.array(formConditionSchema),
    pricingDefinitions: z.array(pricingDefinitionSchema),
    fields: z.array(formElementSchema),
}).superRefine((data, ctx) => {
    const { conditions, pricingDefinitions, fields } = data;

    // Collect all FormField items (flattened from elements)
    const allFields: z.infer<typeof formFieldSchema>[] = [];
    for (const el of fields) {
        if (el.type === "condition") {
            allFields.push(...el.children);
        } else {
            allFields.push(el);
        }
    }

    // Must have at least one field
    if (allFields.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Formulář musí obsahovat alespoň jedno pole",
            path: ["fields"],
        });
    }

    // Check unique field names among input fields
    const inputFields = allFields.filter(
        (f) => f.type !== "heading" && f.type !== "description"
    ) as z.infer<typeof inputFieldSchema>[];

    const names = new Set<string>();
    for (const field of inputFields) {
        if (names.has(field.name)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Duplicitní název pole: ${field.name}`,
                path: ["fields"],
            });
        }
        names.add(field.name);
    }

    // Check select/radio fields have options
    for (const field of inputFields) {
        if (
            (field.type === "select" || field.type === "radio") &&
            (!field.options || field.options.length === 0)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Pole typu výběr musí mít alespoň jednu možnost",
                path: ["fields"],
            });
        }
    }

    // Validate condition blocks reference existing conditions
    const conditionIds = new Set(conditions.map((c) => c.id));
    for (const el of fields) {
        if (el.type === "condition") {
            if (!conditionIds.has(el.conditionId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Blok podmínky odkazuje na neexistující podmínku`,
                    path: ["fields"],
                });
            }
        }
    }

    // Validate condition rules reference existing field IDs
    const allFieldIds = new Set(allFields.map((f) => f.id));
    for (const condition of conditions) {
        for (const rule of condition.rules) {
            if (rule.fieldId && !allFieldIds.has(rule.fieldId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Pravidlo podmínky "${condition.name}" odkazuje na neexistující pole`,
                    path: ["conditions"],
                });
            }
        }
    }

    // Validate pricing_select fields reference existing pricing definitions
    const pricingIds = new Set(pricingDefinitions.map((d) => d.id));
    for (const field of inputFields) {
        if (field.type === "pricing_select") {
            if (!field.pricingId || !pricingIds.has(field.pricingId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Pole "${field.label}" odkazuje na neexistující cenovou skupinu`,
                    path: ["fields"],
                });
            }
        }
    }

    // Validate pricing option prices length matches tiers + 1
    for (const def of pricingDefinitions) {
        for (const opt of def.options) {
            if (opt.prices.length !== def.priceTiers.length + 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Možnost "${opt.name}" v cenové skupině "${def.name}" má nesprávný počet cen`,
                    path: ["pricingDefinitions"],
                });
            }
        }
    }
});

export type SaveRegistrationFormInput = z.infer<typeof saveRegistrationFormSchema>;
