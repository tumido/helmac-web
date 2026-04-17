import type {
    InputField,
    PricingDefinition,
    AdditionalPersonData,
    PricingSummaryData,
    PricingTier,
} from "@/lib/types/registration-form";
import { getCurrentTierIndex } from "@/lib/utils/pricing";

interface ComputePricingSummaryParams {
    pricingDefinitions: PricingDefinition[];
    allInputFields: InputField[];
    submissionData: Record<string, unknown>;
    additionalPeople: AdditionalPersonData[];
    visibleFieldIds: Set<string>;
    apVisibleFieldIdsPerPerson: Set<string>[];
}

/**
 * Computes pricing summary with totals at every tier + fallback.
 * Returns null if no pricing fields exist or no options are selected.
 */
export function computePricingSummary({
    pricingDefinitions,
    allInputFields,
    submissionData,
    additionalPeople,
    visibleFieldIds,
    apVisibleFieldIdsPerPerson,
}: ComputePricingSummaryParams): PricingSummaryData | null {
    if (pricingDefinitions.length === 0) return null;

    const pricingFields = allInputFields.filter(
        (f) => (f.type === "pricing_select" || f.type === "pricing_quantity" || f.type === "pricing_multi_select") && f.pricingId
    );
    if (pricingFields.length === 0) return null;

    // Collect all unique tier dates across all pricing definitions, sorted chronologically
    const tierDateSet = new Set<string>();
    for (const def of pricingDefinitions) {
        for (const date of def.priceTiers) {
            tierDateSet.add(date);
        }
    }
    const allTierDates = Array.from(tierDateSet).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    // Build selected options map: pricingField -> { def, selectedOptions (main + AP) }
    interface SelectedOption {
        def: PricingDefinition;
        optionName: string;
        quantity: number;
    }

    const selections: SelectedOption[] = [];

    for (const field of pricingFields) {
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        if (!def) continue;

        if (field.type === "pricing_quantity") {
            // Quantity-based pricing: value is a number, single option in definition
            const qty = Number(submissionData[field.name] ?? 0);
            if (qty > 0 && visibleFieldIds.has(field.id)) {
                const opt = def.options[0]; // Quantity definitions have exactly 1 option
                if (opt) {
                    selections.push({ def, optionName: opt.name, quantity: qty });
                }
            }

            // Additional people
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    const personQty = Number(person[field.name] ?? 0);
                    if (personQty <= 0) return;
                    if (apVisibleFieldIdsPerPerson[idx] && !apVisibleFieldIdsPerPerson[idx].has(field.id)) {
                        return;
                    }
                    const opt = def.options[0];
                    if (opt) {
                        selections.push({ def, optionName: opt.name, quantity: personQty });
                    }
                });
            }
        } else if (field.type === "pricing_multi_select") {
            // Multi-select pricing: value is JSON array of option names
            const parseSelected = (val: unknown): string[] => {
                try {
                    const arr = JSON.parse(String(val ?? "[]"));
                    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
                } catch {
                    return [];
                }
            };

            const mainSelected = parseSelected(submissionData[field.name]);
            if (mainSelected.length > 0 && visibleFieldIds.has(field.id)) {
                for (const optName of mainSelected) {
                    const opt = def.options.find((o) => o.name === optName);
                    if (opt) {
                        selections.push({ def, optionName: opt.name, quantity: 1 });
                    }
                }
            }

            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    const personSelected = parseSelected(person[field.name]);
                    if (personSelected.length === 0) return;
                    if (apVisibleFieldIdsPerPerson[idx] && !apVisibleFieldIdsPerPerson[idx].has(field.id)) {
                        return;
                    }
                    for (const optName of personSelected) {
                        const opt = def.options.find((o) => o.name === optName);
                        if (opt) {
                            selections.push({ def, optionName: opt.name, quantity: 1 });
                        }
                    }
                });
            }
        } else {
            // Option-based pricing (pricing_select): value is an option name
            const mainVal = String(submissionData[field.name] ?? "");
            if (mainVal && visibleFieldIds.has(field.id)) {
                const opt = def.options.find((o) => o.name === mainVal);
                if (opt) {
                    selections.push({ def, optionName: opt.name, quantity: 1 });
                }
            }

            // Additional people
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    const personVal = String(person[field.name] ?? "");
                    if (!personVal) return;
                    if (apVisibleFieldIdsPerPerson[idx] && !apVisibleFieldIdsPerPerson[idx].has(field.id)) {
                        return;
                    }
                    const opt = def.options.find((o) => o.name === personVal);
                    if (opt) {
                        selections.push({ def, optionName: opt.name, quantity: 1 });
                    }
                });
            }
        }
    }

    if (selections.length === 0) return null;

    // For each tier date, compute total price by simulating that date
    const tiers: PricingTier[] = [];

    for (const tierDate of allTierDates) {
        // Simulate being just before this deadline
        const simulatedDate = new Date(new Date(tierDate).getTime() - 1);
        let totalPrice = 0;

        for (const { def, optionName, quantity } of selections) {
            const tierIdx = getCurrentTierIndex(def.priceTiers, simulatedDate);
            const opt = def.options.find((o) => o.name === optionName);
            if (opt) {
                totalPrice += (opt.prices[tierIdx] ?? 0) * quantity;
            }
        }

        tiers.push({ tierDate, totalPrice });
    }

    // Add fallback tier (after all deadlines)
    {
        // Simulate a date well past any deadline
        const farFuture = new Date("2099-12-31");
        let totalPrice = 0;

        for (const { def, optionName, quantity } of selections) {
            const tierIdx = getCurrentTierIndex(def.priceTiers, farFuture);
            const opt = def.options.find((o) => o.name === optionName);
            if (opt) {
                totalPrice += (opt.prices[tierIdx] ?? 0) * quantity;
            }
        }

        tiers.push({ tierDate: null, totalPrice });
    }

    // Determine applicable tier using current time
    const now = new Date();
    let applicableTierIndex = tiers.length - 1; // default to fallback
    for (let i = 0; i < allTierDates.length; i++) {
        if (now <= new Date(allTierDates[i])) {
            applicableTierIndex = i;
            break;
        }
    }

    return {
        tiers,
        applicableTierIndex,
        totalPrice: tiers[applicableTierIndex].totalPrice,
    };
}
