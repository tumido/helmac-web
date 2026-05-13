import type { FormCondition, FormField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { parseQuantities } from "@/lib/utils/pricing-field-values";

export function evaluateCondition(
    condition: FormCondition,
    rawData: Record<string, unknown>,
    allFields: FormField[],
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
                        if (Array.isArray(arr)) parsedArr = arr;
                    } catch { /* ignore */ }
                }

                if (rule.operator === "quantity_gt_zero") {
                    if (targetField.type === "pricing_quantity") {
                        const quantities = parseQuantities(rawData[targetField.name]);
                        passes = Number(quantities[rule.value ?? ""]) > 0;
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
                        ? currentValue === rule.value
                        : currentValue !== rule.value;
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
