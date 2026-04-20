import type { RegistrationFormData, CapacityLimit, FormCondition, InfoStatsConfig, InfoStatItem } from "@/lib/types/registration-form";

/**
 * Migrates raw form data from the database to the new RegistrationFormData format.
 * Old forms stored as flat FormField[] arrays are wrapped in { conditions: [], fields: [...] }.
 * Also auto-migrates old capacity rules from conditions into capacityLimits.
 */
export function migrateFormData(raw: unknown): RegistrationFormData {
    if (!raw) return { conditions: [], pricingDefinitions: [], priceTiers: [], capacityLimits: [], showOptionCounts: [], fields: [] };
    if (Array.isArray(raw)) return { conditions: [], pricingDefinitions: [], priceTiers: [], capacityLimits: [], showOptionCounts: [], fields: raw };
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
                    fieldIds: [fieldId],
                    showPeople,
                    personFieldId: showPeople ? oldPersonFieldId : undefined,
                };
            });

            infoStatsConfig = {
                enabled: infoStatsConfig.enabled ?? false,
                stats,
            } as InfoStatsConfig;
        }

        // Migrate stats with singular fieldId to fieldIds array
        if (infoStatsConfig && "stats" in infoStatsConfig && Array.isArray(infoStatsConfig.stats)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            infoStatsConfig.stats = infoStatsConfig.stats.map((stat: any) => {
                if (stat.fieldId && !stat.fieldIds) {
                    const { fieldId, ...rest } = stat;
                    return { ...rest, fieldIds: [fieldId] };
                }
                return stat;
            });
        }

        // Migrate pricing tiers from per-definition to form-level
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pricingDefinitions = (data.pricingDefinitions ?? []) as any[];
        let priceTiers = (data.priceTiers ?? null) as string[] | null;

        if (priceTiers === null && pricingDefinitions.length > 0) {
            // Old format: priceTiers on each definition → merge into shared form-level tiers
            const tierDateSet = new Set<string>();
            for (const def of pricingDefinitions) {
                if (def.priceTiers && Array.isArray(def.priceTiers)) {
                    for (const date of def.priceTiers) {
                        if (date) tierDateSet.add(date);
                    }
                }
            }
            priceTiers = Array.from(tierDateSet).sort(
                (a, b) => new Date(a).getTime() - new Date(b).getTime()
            );

            pricingDefinitions = pricingDefinitions.map((def) => {
                const oldTiers: string[] = def.priceTiers ?? [];
                const hadTiers = oldTiers.length > 0;

                if (hadTiers) {
                    // Remap option prices to match the new shared tier order
                    const options = (def.options ?? []).map((opt: { prices?: number[];[key: string]: unknown }) => {
                        const oldPrices: number[] = opt.prices ?? [];
                        const fallback = oldPrices[oldTiers.length] ?? 0;
                        const newPrices = priceTiers!.map((sharedDate) => {
                            const oldIdx = oldTiers.indexOf(sharedDate);
                            return oldIdx >= 0 ? (oldPrices[oldIdx] ?? 0) : 0;
                        });
                        newPrices.push(fallback);
                        return { ...opt, prices: newPrices };
                    });
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { priceTiers: _removed, ...rest } = def;
                    return { ...rest, usePriceTiers: true, options };
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { priceTiers: _removed, ...rest } = def;
                    return { ...rest, usePriceTiers: false };
                }
            });
        } else if (priceTiers === null) {
            priceTiers = [];
        }

        return {
            conditions,
            pricingDefinitions: pricingDefinitions as RegistrationFormData["pricingDefinitions"],
            priceTiers,
            capacityLimits,
            showOptionCounts: (data.showOptionCounts ?? []) as string[],
            infoStatsConfig,
            fields: (data.fields ?? []) as RegistrationFormData["fields"],
        };
    }
    return { conditions: [], pricingDefinitions: [], priceTiers: [], capacityLimits: [], showOptionCounts: [], fields: [] };
}
