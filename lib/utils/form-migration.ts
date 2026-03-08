import type { RegistrationFormData } from "@/lib/types/registration-form";

/**
 * Migrates raw form data from the database to the new RegistrationFormData format.
 * Old forms stored as flat FormField[] arrays are wrapped in { conditions: [], fields: [...] }.
 */
export function migrateFormData(raw: unknown): RegistrationFormData {
    if (!raw) return { conditions: [], fields: [] };
    if (Array.isArray(raw)) return { conditions: [], fields: raw };
    if (typeof raw === "object" && "conditions" in raw && "fields" in raw) {
        return raw as RegistrationFormData;
    }
    return { conditions: [], fields: [] };
}
