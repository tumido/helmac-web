import type {
    InputField,
    PricingDefinition,
    AdditionalPersonData,
    PricingSummaryData,
    PricingTier,
} from "@/lib/types/registration-form";
import { getCurrentTierIndex } from "@/lib/utils/pricing";
import { parseQuantities, parseSelected } from "@/lib/utils/pricing-field-values";

interface ComputePricingSummaryParams {
    pricingDefinitions: PricingDefinition[];
    priceTiers: string[];
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
    priceTiers,
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

    // Use form-level shared tier dates
    const allTierDates = [...priceTiers].sort(
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
            // Quantity JSON is keyed by opt.id (post-redesign form); tolerate
            // opt.name as a fallback for legacy submissions.
            if (visibleFieldIds.has(field.id)) {
                const mainQty = parseQuantities(submissionData[field.name]);
                for (const opt of def.options) {
                    const qty = Number(mainQty[opt.id] ?? mainQty[opt.name]) || 0;
                    if (qty <= 0) continue;
                    selections.push({ def, optionName: opt.name, quantity: qty });
                }
            }

            // Additional people
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    if (apVisibleFieldIdsPerPerson[idx] && !apVisibleFieldIdsPerPerson[idx].has(field.id)) {
                        return;
                    }
                    const personQty = parseQuantities(person[field.name]);
                    for (const opt of def.options) {
                        const qty = Number(personQty[opt.id] ?? personQty[opt.name]) || 0;
                        if (qty <= 0) continue;
                        selections.push({ def, optionName: opt.name, quantity: qty });
                    }
                });
            }
        } else if (field.type === "pricing_multi_select") {
            const mainSelected = parseSelected(submissionData[field.name]);
            if (mainSelected.length > 0 && visibleFieldIds.has(field.id)) {
                for (const optKey of mainSelected) {
                    const opt =
                        def.options.find((o) => o.id === optKey) ??
                        def.options.find((o) => o.name === optKey);
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
                    for (const optKey of personSelected) {
                        const opt =
                            def.options.find((o) => o.id === optKey) ??
                            def.options.find((o) => o.name === optKey);
                        if (opt) {
                            selections.push({ def, optionName: opt.name, quantity: 1 });
                        }
                    }
                });
            }
        } else {
            // pricing_select: value is opt.id (post-redesign) or opt.name (legacy)
            const mainVal = String(submissionData[field.name] ?? "");
            if (mainVal && visibleFieldIds.has(field.id)) {
                const opt =
                    def.options.find((o) => o.id === mainVal) ??
                    def.options.find((o) => o.name === mainVal);
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
                    const opt =
                        def.options.find((o) => o.id === personVal) ??
                        def.options.find((o) => o.name === personVal);
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
            const defTiers = def.usePriceTiers ? priceTiers : [];
            const tierIdx = getCurrentTierIndex(defTiers, simulatedDate);
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
            const defTiers = def.usePriceTiers ? priceTiers : [];
            const tierIdx = getCurrentTierIndex(defTiers, farFuture);
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
        tiers: tiers.map((t) => ({
            ...t,
            totalPrice: Math.max(0, t.totalPrice),
        })),
        applicableTierIndex,
        totalPrice: Math.max(0, tiers[applicableTierIndex].totalPrice),
    };
}
