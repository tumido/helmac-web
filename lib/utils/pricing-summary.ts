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
        (f) => f.type === "pricing_select" && f.pricingId
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
    }

    const selections: SelectedOption[] = [];

    for (const field of pricingFields) {
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        if (!def) continue;

        // Main person
        const mainVal = String(submissionData[field.name] ?? "");
        if (mainVal && visibleFieldIds.has(field.id)) {
            const opt = def.options.find((o) => o.name === mainVal);
            if (opt) {
                selections.push({ def, optionName: opt.name });
            }
        }

        // Additional people
        if (field.includeForAdditionalPeople) {
            additionalPeople.forEach((person, idx) => {
                const personVal = String(person[field.name] ?? "");
                if (!personVal) return;

                // Check visibility for this AP
                if (apVisibleFieldIdsPerPerson[idx] && !apVisibleFieldIdsPerPerson[idx].has(field.id)) {
                    return;
                }

                const opt = def.options.find((o) => o.name === personVal);
                if (opt) {
                    selections.push({ def, optionName: opt.name });
                }
            });
        }
    }

    if (selections.length === 0) return null;

    // For each tier date, compute total price by simulating that date
    const tiers: PricingTier[] = [];

    for (const tierDate of allTierDates) {
        // Simulate being just before this deadline
        const simulatedDate = new Date(new Date(tierDate).getTime() - 1);
        let totalPrice = 0;

        for (const { def, optionName } of selections) {
            const tierIdx = getCurrentTierIndex(def.priceTiers, simulatedDate);
            const opt = def.options.find((o) => o.name === optionName);
            if (opt) {
                totalPrice += opt.prices[tierIdx] ?? 0;
            }
        }

        tiers.push({ tierDate, totalPrice });
    }

    // Add fallback tier (after all deadlines)
    {
        // Simulate a date well past any deadline
        const farFuture = new Date("2099-12-31");
        let totalPrice = 0;

        for (const { def, optionName } of selections) {
            const tierIdx = getCurrentTierIndex(def.priceTiers, farFuture);
            const opt = def.options.find((o) => o.name === optionName);
            if (opt) {
                totalPrice += opt.prices[tierIdx] ?? 0;
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
