import type {
    InputField,
    PricingDefinition,
    CapacityLimit,
    OptionCounts,
} from "@/lib/types/registration-form";
import { getRemainingCapacityForField } from "@/lib/types/registration-form";
import { parseQuantities, parseSelected } from "@/lib/utils/pricing-field-values";

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
    const info = getFieldRemainingInfo(
        field,
        pricingDefinitions,
        capacityLimits,
        optionCounts,
        othersData,
    );
    return info.remaining;
}

export interface FieldRemainingInfo {
    /** option name -> remaining slots; undefined when the field has no capacity limits */
    remaining?: Record<string, number>;
    /** option names whose remaining count is <= 0 */
    disabled: Set<string>;
}

/**
 * Generic remaining/disabled computation for any field that supports capacity
 * limits. Subtracts selections made by other persons in the same submission
 * (`othersData` = all persons EXCEPT the one whose form is currently rendered)
 * from the DB-derived base.
 *
 * Returned `remaining` and `disabled` are keyed by option NAME (the same key
 * used for `CapacityLimit.value`). For pricing fields whose values are option
 * IDs (pricing_select, pricing_multi_select), values are mapped back to names
 * via the matching PricingDefinition.
 */
export function getFieldRemainingInfo(
    field: InputField,
    pricingDefinitions: PricingDefinition[],
    capacityLimits: CapacityLimit[],
    optionCounts: OptionCounts | undefined,
    othersData: Array<Record<string, unknown>>,
): FieldRemainingInfo {
    const base = getRemainingCapacityForField(
        field.id,
        field.name,
        capacityLimits,
        optionCounts,
    );
    const hasLimits = Object.keys(base).length > 0;
    if (!hasLimits) {
        return { remaining: undefined, disabled: new Set<string>() };
    }

    const def =
        "pricingId" in field && field.pricingId
            ? pricingDefinitions.find((d) => d.id === field.pricingId)
            : undefined;
    const keyToName: Record<string, string> = {};
    if (def) {
        for (const opt of def.options) {
            keyToName[opt.id] = opt.name;
            keyToName[opt.name] = opt.name;
        }
    }

    const result = { ...base };

    const decrement = (rawName: string, qty: number) => {
        const optName = keyToName[rawName] ?? rawName;
        if (result[optName] !== undefined) {
            result[optName] = Math.max(0, result[optName] - qty);
        }
    };

    for (const person of othersData) {
        const raw = person[field.name];
        if (raw === undefined || raw === null) continue;

        if (field.type === "pricing_quantity") {
            const qMap = parseQuantities(raw);
            for (const [key, qty] of Object.entries(qMap)) {
                decrement(key, Number(qty) || 0);
            }
        } else if (field.type === "pricing_multi_select") {
            for (const key of parseSelected(raw)) {
                decrement(key, 1);
            }
        } else {
            const val = String(raw);
            if (val !== "") decrement(val, 1);
        }
    }

    const disabled = new Set<string>();
    for (const [optName, remaining] of Object.entries(result)) {
        if (remaining <= 0) disabled.add(optName);
    }

    return { remaining: result, disabled };
}
