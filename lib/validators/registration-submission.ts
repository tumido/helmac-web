import { z } from "zod";
import type { FormField, InputField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";

/**
 * Dynamically builds a Zod schema from form field definitions.
 * Used both client-side (for validation feedback) and server-side (for submission validation).
 */
export function buildSubmissionSchema(fields: FormField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const field of fields) {
        if (!isInputField(field)) continue;

        shape[field.name] = buildFieldSchema(field);
    }

    return z.object(shape);
}

function buildFieldSchema(field: InputField): z.ZodTypeAny {
    switch (field.type) {
        case "email": {
            let schema = z.string().email("Neplatný formát emailu");
            if (field.required) {
                schema = schema.min(1, "Toto pole je povinné");
            }
            return field.required ? schema : schema.or(z.literal("")).optional();
        }

        case "number": {
            const schema = z.coerce.number({ message: "Zadejte platné číslo" });
            return field.required ? schema : schema.optional().or(z.literal(""));
        }

        case "checkbox": {
            const schema = z.boolean();
            if (field.required) {
                return schema.refine((val) => val === true, {
                    message: "Toto pole je povinné",
                });
            }
            return schema;
        }

        case "date": {
            let schema = z.string();
            if (field.required) {
                schema = schema.min(1, "Toto pole je povinné");
            }
            return field.required ? schema : schema.optional().or(z.literal(""));
        }

        case "select":
        case "radio": {
            let schema = z.string();
            if (field.required) {
                schema = schema.min(1, "Vyberte jednu z možností");
            }
            return field.required ? schema : schema.optional().or(z.literal(""));
        }

        case "text":
        case "textarea":
        default: {
            let schema = z.string();
            if (field.required) {
                schema = schema.min(1, "Toto pole je povinné");
            }
            return field.required ? schema : schema.optional().or(z.literal(""));
        }
    }
}
