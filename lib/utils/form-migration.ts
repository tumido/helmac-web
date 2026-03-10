import type { RegistrationFormData, CapacityLimit, FormCondition } from "@/lib/types/registration-form";

/**
 * Migrates raw form data from the database to the new RegistrationFormData format.
 * Old forms stored as flat FormField[] arrays are wrapped in { conditions: [], fields: [...] }.
 * Also auto-migrates old capacity rules from conditions into capacityLimits.
 */
export function migrateFormData(raw: unknown): RegistrationFormData {
    if (!raw) return { conditions: [], pricingDefinitions: [], capacityLimits: [], fields: [] };
    if (Array.isArray(raw)) return { conditions: [], pricingDefinitions: [], capacityLimits: [], fields: raw };
    if (typeof raw === "object" && "conditions" in raw && "fields" in raw) {
        const data = raw as Record<string, unknown>;
        let conditions = (data.conditions ?? []) as FormCondition[];
        let capacityLimits = (data.capacityLimits ?? []) as CapacityLimit[];

        // Auto-migrate: extract capacity rules from conditions into capacityLimits
        if (capacityLimits.length === 0) {
            const extracted: CapacityLimit[] = [];
            const migratedConditions: FormCondition[] = [];

            for (const condition of conditions) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const capacityRules = condition.rules.filter((r: any) => r.type === "capacity");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const remainingRules = condition.rules.filter((r: any) => r.type !== "capacity");

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (const rule of capacityRules as any[]) {
                    if (rule.fieldId && rule.value && rule.maxCount) {
                        extracted.push({
                            id: crypto.randomUUID(),
                            fieldId: rule.fieldId,
                            value: rule.value,
                            maxCount: rule.maxCount,
                        });
                    }
                }

                // Keep condition only if it still has rules
                if (remainingRules.length > 0) {
                    migratedConditions.push({ ...condition, rules: remainingRules });
                }
                // Drop conditions that become empty after removing capacity rules
            }

            if (extracted.length > 0) {
                capacityLimits = extracted;
                conditions = migratedConditions;
            }
        }

        return {
            conditions,
            pricingDefinitions: (data.pricingDefinitions ?? []) as RegistrationFormData["pricingDefinitions"],
            capacityLimits,
            fields: (data.fields ?? []) as RegistrationFormData["fields"],
        };
    }
    return { conditions: [], pricingDefinitions: [], capacityLimits: [], fields: [] };
}
