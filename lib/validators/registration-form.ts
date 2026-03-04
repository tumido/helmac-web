import { z } from "zod";

const fieldConditionSchema = z.object({
    fieldId: z.string().min(1),
    operator: z.enum(["equals", "not_equals"]),
    value: z.string(),
});

const inputFieldSchema = z.object({
    type: z.enum(["text", "email", "textarea", "number", "checkbox", "select", "radio", "date"]),
    id: z.string().min(1),
    name: z.string().min(1),
    label: z.string().min(1, "Popisek je povinný"),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
    condition: fieldConditionSchema.optional(),
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

export const saveRegistrationFormSchema = z.object({
    fields: z
        .array(formFieldSchema)
        .min(1, "Formulář musí obsahovat alespoň jedno pole")
        .superRefine((fields, ctx) => {
            // Check unique field names among input fields
            const names = fields
                .filter((f) => f.type !== "heading" && f.type !== "description")
                .map((f) => (f as { name: string }).name);
            const seen = new Set<string>();
            names.forEach((name, idx) => {
                if (seen.has(name)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Duplicitní název pole: ${name}`,
                        path: [idx, "name"],
                    });
                }
                seen.add(name);
            });

            // Check select/radio fields have options
            fields.forEach((field, idx) => {
                if (
                    (field.type === "select" || field.type === "radio") &&
                    (!("options" in field) || !field.options || field.options.length === 0)
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Pole typu výběr musí mít alespoň jednu možnost",
                        path: [idx, "options"],
                    });
                }
            });
        }),
});

export type SaveRegistrationFormInput = z.infer<typeof saveRegistrationFormSchema>;
