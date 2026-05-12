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

        case "date":
        case "birth_date": {
            let schema = z.string();
            if (field.required) {
                schema = schema.min(1, "Toto pole je povinné");
            }
            return field.required ? schema : schema.optional().or(z.literal(""));
        }

        case "select":
        case "radio":
        case "pricing_select": {
            let schema = z.string();
            if (field.required) {
                schema = schema.min(1, "Vyberte jednu z možností");
            }
            return field.required ? schema : schema.optional().or(z.literal(""));
        }

        case "pricing_multi_select": {
            // Value is a JSON-serialized string array, e.g. '["Opt1","Opt2"]'
            const msSchema = z.string().refine((val) => {
                try {
                    const arr = JSON.parse(val);
                    return Array.isArray(arr) && arr.every((v: unknown) => typeof v === "string");
                } catch {
                    return val === "" || val === "[]";
                }
            }, { message: "Neplatný výběr" });
            if (field.required) {
                return msSchema.refine((val) => {
                    try {
                        const arr = JSON.parse(val);
                        return Array.isArray(arr) && arr.length > 0;
                    } catch {
                        return false;
                    }
                }, { message: "Vyberte alespoň jednu možnost" });
            }
            return msSchema;
        }

        case "pricing_quantity": {
            // Value is a JSON-serialized object of quantities, e.g. '{"Opt1":2,"Opt2":1}'
            const parseValue = (val: string): Record<string, number> | null => {
                try {
                    const parsed = JSON.parse(val || "{}");
                    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                        return null;
                    }
                    for (const v of Object.values(parsed as Record<string, unknown>)) {
                        if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
                            return null;
                        }
                    }
                    return parsed as Record<string, number>;
                } catch {
                    return null;
                }
            };
            const qSchema = z.string().refine(
                (val) => val === "" || parseValue(val) !== null,
                { message: "Neplatná hodnota" },
            );
            if (field.required) {
                return qSchema.refine((val) => {
                    const parsed = parseValue(val);
                    if (!parsed) return false;
                    return Object.values(parsed).some((n) => n > 0);
                }, { message: "Vyberte alespoň jednu možnost" });
            }
            return qSchema;
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
