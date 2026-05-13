import type {
    FormCondition,
    FormField,
    InputField,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { parseQuantities } from "@/lib/utils/pricing-field-values";

/**
 * Rule values authored in the condition editor are option *names* (the editor
 * uses `<MenuItem value={opt.name}>`). Submission data stores option *ids*
 * post-redesign. Translate a stored value into the option name (with both-
 * direction tolerance) so equality checks line up regardless of which world
 * the data originated in.
 */
function pricingValueToName(
    field: InputField,
    value: string,
    pricingDefinitions: PricingDefinition[] | undefined,
): string {
    if (!field.pricingId || !pricingDefinitions) return value;
    const def = pricingDefinitions.find((d) => d.id === field.pricingId);
    if (!def) return value;
    const opt =
        def.options.find((o) => o.id === value) ??
        def.options.find((o) => o.name === value);
    return opt?.name ?? value;
}

export function evaluateCondition(
    condition: FormCondition,
    rawData: Record<string, unknown>,
    allFields: FormField[],
    pricingDefinitions?: PricingDefinition[],
): boolean {
    let result: boolean | null = null;
    for (let i = 0; i < condition.rules.length; i++) {
        const rule = condition.rules[i];
        let passes: boolean;

        if (!rule.fieldId || rule.operator === undefined) {
            passes = false;
        } else {
            const targetField = allFields.find((f) => f.id === rule.fieldId);
            if (!targetField || !isInputField(targetField)) {
                passes = false;
            } else {
                const currentValue = String(rawData[targetField.name] ?? "");

                let parsedArr: unknown[] | null = null;
                if (targetField.type === "pricing_multi_select" && currentValue.startsWith("[")) {
                    try {
                        const arr = JSON.parse(currentValue);
                        if (Array.isArray(arr)) {
                            parsedArr = arr.map((v) =>
                                pricingValueToName(targetField, String(v), pricingDefinitions),
                            );
                        }
                    } catch { /* ignore */ }
                }

                // Normalise scalar pricing_select values (id → name).
                const normalizedValue =
                    targetField.type === "pricing_select"
                        ? pricingValueToName(targetField, currentValue, pricingDefinitions)
                        : currentValue;

                if (rule.operator === "quantity_gt_zero" || rule.operator === "quantity_any_gt_zero") {
                    if (targetField.type === "pricing_quantity") {
                        const quantities = parseQuantities(rawData[targetField.name]);
                        if (rule.operator === "quantity_any_gt_zero") {
                            passes = Object.values(quantities).some((q) => Number(q) > 0);
                        } else {
                            // quantity_gt_zero: look up the option by id first
                            // (post-redesign keys) then by name (legacy / rule
                            // value is the option name from the editor).
                            const key = rule.value ?? "";
                            const def = targetField.pricingId
                                ? pricingDefinitions?.find((d) => d.id === targetField.pricingId)
                                : undefined;
                            const opt = def?.options.find(
                                (o) => o.name === key || o.id === key,
                            );
                            const qty = opt
                                ? Number(quantities[opt.id] ?? quantities[opt.name]) || 0
                                : Number(quantities[key]) || 0;
                            passes = qty > 0;
                        }
                    } else {
                        passes = false;
                    }
                } else if (rule.operator === "is_set" || rule.operator === "is_not_set") {
                    let isSet: boolean;
                    if (parsedArr !== null) {
                        isSet = parsedArr.length > 0;
                    } else if (targetField.type === "checkbox") {
                        isSet = currentValue === "true";
                    } else {
                        isSet = currentValue.trim() !== "";
                    }
                    passes = rule.operator === "is_set" ? isSet : !isSet;
                } else if (parsedArr !== null) {
                    const includes = parsedArr.includes(rule.value);
                    passes = rule.operator === "equals" ? includes : !includes;
                } else {
                    passes = rule.operator === "equals"
                        ? normalizedValue === rule.value
                        : normalizedValue !== rule.value;
                }
            }
        }

        if (result === null) {
            result = passes;
        } else {
            const connector = rule.connector ?? "AND";
            result = connector === "OR" ? (result || passes) : (result && passes);
        }
    }
    return result ?? false;
}
