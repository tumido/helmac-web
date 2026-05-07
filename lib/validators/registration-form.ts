import { z } from "zod";

const conditionRuleSchema = z.object({
    type: z.literal("field_value"),
    fieldId: z.string().min(1),
    operator: z.enum(["equals", "not_equals"]),
    value: z.string(),
});

const capacityLimitSchema = z.object({
    id: z.string().min(1),
    fieldId: z.string().min(1),
    value: z.string().min(1),
    maxCount: z.number().int().min(1),
});

const formConditionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Název podmínky je povinný"),
    rules: z.array(conditionRuleSchema).min(1, "Podmínka musí mít alespoň jedno pravidlo"),
});

const inputFieldSchema = z.object({
    type: z.enum(["text", "email", "textarea", "number", "checkbox", "select", "radio", "date", "birth_date", "pricing_select", "pricing_quantity", "pricing_multi_select"]),
    id: z.string().min(1),
    name: z.string().min(1),
    label: z.string().min(1, "Popisek je povinný"),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
    pricingId: z.string().optional(),
    includeForAdditionalPeople: z.boolean().optional(),
    displayVariant: z.enum(["default", "image_cards"]).optional(),
    optionMeta: z
        .record(
            z.string(),
            z.object({
                imageUrl: z.string().url().optional(),
            })
        )
        .optional(),
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
    type: z.enum(["options", "quantity"]).optional(),
    multiSelect: z.boolean().optional(),
    unitName: z.string().optional(),
    usePriceTiers: z.boolean(),
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

export const saveCapacityLimitsSchema = z.array(capacityLimitSchema);

export const saveShowOptionCountsSchema = z.array(z.string().min(1));

const infoStatItemSchema = z.object({
    id: z.string().min(1),
    fieldIds: z.array(z.string().min(1)).min(1, "Statistika musí mít alespoň jedno pole"),
    name: z.string().optional(),
    showPeople: z.boolean(),
    personFieldId: z.string().min(1).optional(),
}).refine(
    (data) => !data.showPeople || !!data.personFieldId,
    { message: "Pole pro jméno osoby je povinné při zobrazení osob", path: ["personFieldId"] },
);

export const saveInfoStatsConfigSchema = z.object({
    enabled: z.boolean(),
    stats: z.array(infoStatItemSchema),
});

export const saveRegistrationFormSchema = z.object({
    conditions: z.array(formConditionSchema),
    pricingDefinitions: z.array(pricingDefinitionSchema),
    priceTiers: z.array(z.string()).default([]),
    capacityLimits: z.array(capacityLimitSchema).default([]),
    showOptionCounts: z.array(z.string()).default([]),
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

    // Reserved name check
    for (const field of inputFields) {
        if (field.name === "additionalPeople") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Název pole \"additionalPeople\" je rezervovaný",
                path: ["fields"],
            });
        }
    }

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

    // Validate pricing_select and pricing_quantity fields reference existing pricing definitions
    const pricingIds = new Set(pricingDefinitions.map((d) => d.id));
    for (const field of inputFields) {
        if (field.type === "pricing_select" || field.type === "pricing_quantity" || field.type === "pricing_multi_select") {
            if (!field.pricingId || !pricingIds.has(field.pricingId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Pole "${field.label}" odkazuje na neexistující cenovou skupinu`,
                    path: ["fields"],
                });
            }
        }
    }

    // Validate pricing option prices length matches tiers + 1 (or 1 for flat pricing)
    for (const def of pricingDefinitions) {
        const expectedLength = def.usePriceTiers ? data.priceTiers.length + 1 : 1;
        for (const opt of def.options) {
            if (opt.prices.length !== expectedLength) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Možnost "${opt.name}" v cenové skupině "${def.name}" má nesprávný počet cen`,
                    path: ["pricingDefinitions"],
                });
            }
        }
    }

    // Validate capacity limits reference existing field IDs
    if (data.capacityLimits) {
        for (const limit of data.capacityLimits) {
            if (!allFieldIds.has(limit.fieldId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Limit kapacity odkazuje na neexistující pole`,
                    path: ["capacityLimits"],
                });
            }
        }
    }
});

export type SaveRegistrationFormInput = z.infer<typeof saveRegistrationFormSchema>;
