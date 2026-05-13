import type {
    InputField,
    PricingDefinition,
    CapacityLimit,
    OptionCounts,
} from "@/lib/types/registration-form";
import { getRemainingCapacityForField } from "@/lib/types/registration-form";
import { parseQuantities } from "@/lib/utils/pricing-field-values";

/**
 * Computes optionName -> remaining units for a `pricing_quantity` field,
 * subtracting selections from any other persons (not the one currently filling it).
 * The disable check inside DynamicFormField is `qty >= remaining`, so callers
 * should pass `othersData` = all persons EXCEPT the one whose form is rendered.
 */
export function getQuantityRemainingForField(
    field: InputField,
    pricingDefinitions: PricingDefinition[],
    capacityLimits: CapacityLimit[],
    optionCounts: OptionCounts | undefined,
    othersData: Array<Record<string, unknown>>,
): Record<string, number> | undefined {
    if (field.type !== "pricing_quantity") return undefined;
    const base = getRemainingCapacityForField(
        field.id,
        field.name,
        capacityLimits,
        optionCounts,
    );
    if (Object.keys(base).length === 0) return undefined;

    const def = pricingDefinitions.find((d) => d.id === field.pricingId);
    const keyToName: Record<string, string> = {};
    if (def) {
        for (const opt of def.options) {
            keyToName[opt.id] = opt.name;
            keyToName[opt.name] = opt.name;
        }
    }

    const result = { ...base };
    for (const person of othersData) {
        const qMap = parseQuantities(person[field.name]);
        for (const [key, qty] of Object.entries(qMap)) {
            const optName = keyToName[key] ?? key;
            if (result[optName] !== undefined) {
                result[optName] = Math.max(0, result[optName] - (Number(qty) || 0));
            }
        }
    }
    return result;
}
