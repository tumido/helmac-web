import type { RegistrationFormData, CapacityLimit, FormCondition, InfoStatsConfig, InfoStatItem } from "@/lib/types/registration-form";

/**
 * Migrates raw form data from the database to the new RegistrationFormData format.
 * Old forms stored as flat FormField[] arrays are wrapped in { conditions: [], fields: [...] }.
 * Also auto-migrates old capacity rules from conditions into capacityLimits.
 */
export function migrateFormData(raw: unknown): RegistrationFormData {
    if (!raw) return { conditions: [], pricingDefinitions: [], capacityLimits: [], showOptionCounts: [], fields: [] };
    if (Array.isArray(raw)) return { conditions: [], pricingDefinitions: [], capacityLimits: [], showOptionCounts: [], fields: raw };
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

        // Migrate old showPeople boolean to showPeopleFieldIds array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let infoStatsConfig = (data.infoStatsConfig as any | undefined) ?? undefined;
        if (infoStatsConfig && "showPeople" in infoStatsConfig && !("showPeopleFieldIds" in infoStatsConfig)) {
            const { showPeople, ...rest } = infoStatsConfig;
            infoStatsConfig = {
                ...rest,
                showPeopleFieldIds: showPeople ? (rest.fieldIds ?? []) : [],
            };
        }

        // Migrate old fieldIds format to new stats array format
        if (infoStatsConfig && "fieldIds" in infoStatsConfig && !("stats" in infoStatsConfig)) {
            const oldFieldIds: string[] = infoStatsConfig.fieldIds ?? [];
            const oldShowPeopleFieldIds: string[] = infoStatsConfig.showPeopleFieldIds ?? [];
            const oldPersonFieldId: string | undefined = infoStatsConfig.personFieldId;

            const stats: InfoStatItem[] = oldFieldIds.map((fieldId: string) => {
                const showPeople = oldShowPeopleFieldIds.includes(fieldId);
                return {
                    id: crypto.randomUUID(),
                    fieldId,
                    showPeople,
                    personFieldId: showPeople ? oldPersonFieldId : undefined,
                };
            });

            infoStatsConfig = {
                enabled: infoStatsConfig.enabled ?? false,
                stats,
            } as InfoStatsConfig;
        }

        return {
            conditions,
            pricingDefinitions: (data.pricingDefinitions ?? []) as RegistrationFormData["pricingDefinitions"],
            capacityLimits,
            showOptionCounts: (data.showOptionCounts ?? []) as string[],
            infoStatsConfig,
            fields: (data.fields ?? []) as RegistrationFormData["fields"],
        };
    }
    return { conditions: [], pricingDefinitions: [], capacityLimits: [], showOptionCounts: [], fields: [] };
}
