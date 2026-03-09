import type { RegistrationFormData } from "@/lib/types/registration-form";

/**
 * Migrates raw form data from the database to the new RegistrationFormData format.
 * Old forms stored as flat FormField[] arrays are wrapped in { conditions: [], fields: [...] }.
 */
export function migrateFormData(raw: unknown): RegistrationFormData {
    if (!raw) return { conditions: [], pricingDefinitions: [], fields: [] };
    if (Array.isArray(raw)) return { conditions: [], pricingDefinitions: [], fields: raw };
    if (typeof raw === "object" && "conditions" in raw && "fields" in raw) {
        const data = raw as Record<string, unknown>;
        return {
            conditions: (data.conditions ?? []) as RegistrationFormData["conditions"],
            pricingDefinitions: (data.pricingDefinitions ?? []) as RegistrationFormData["pricingDefinitions"],
            fields: (data.fields ?? []) as RegistrationFormData["fields"],
        };
    }
    return { conditions: [], pricingDefinitions: [], fields: [] };
}
