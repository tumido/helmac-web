"use client";

import { useMemo } from "react";
import type { FormField, SubmissionData, OptionCounts } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";

export interface ConditionalFieldsResult {
    visibleFields: Set<string>;
    disabledOptions: Record<string, Set<string>>;
}

/**
 * Returns visible field IDs and disabled options based on current form values
 * and aggregate option counts (capacity conditions).
 */
export function useConditionalFields(
    fields: FormField[],
    values: SubmissionData,
    optionCounts?: OptionCounts
): ConditionalFieldsResult {
    return useMemo(() => {
        const visibleFields = new Set<string>();
        const disabledOptions: Record<string, Set<string>> = {};

        for (const field of fields) {
            if (!isInputField(field)) {
                visibleFields.add(field.id);
                continue;
            }

            // 1. Evaluate regular condition
            let regularConditionPasses = true;
            if (field.condition) {
                const { fieldId, operator, value } = field.condition;
                const targetField = fields.find((f) => f.id === fieldId);
                if (targetField && isInputField(targetField)) {
                    const currentValue = String(values[targetField.name] ?? "");
                    if (operator === "equals") {
                        regularConditionPasses = currentValue === value;
                    } else if (operator === "not_equals") {
                        regularConditionPasses = currentValue !== value;
                    }
                }
            }

            // 2. Evaluate count condition
            let countConditionPasses = true;
            if (field.countCondition && optionCounts) {
                const cc = field.countCondition;

                if (cc.action === "hide_field" && cc.fieldId && cc.value && cc.maxCount != null) {
                    const targetField = fields.find((f) => f.id === cc.fieldId);
                    if (targetField && isInputField(targetField)) {
                        const targetName = targetField.name;
                        const currentCount = optionCounts[targetName]?.[cc.value] ?? 0;
                        if (currentCount >= cc.maxCount) {
                            countConditionPasses = false;
                        }
                    }
                }

                if (cc.action === "disable_option" && cc.optionLimits) {
                    const fieldName = field.name;
                    for (const limit of cc.optionLimits) {
                        const currentCount = optionCounts[fieldName]?.[limit.value] ?? 0;
                        if (currentCount >= limit.maxCount) {
                            if (!disabledOptions[field.id]) {
                                disabledOptions[field.id] = new Set();
                            }
                            disabledOptions[field.id].add(limit.value);
                        }
                    }
                    // disable_option never hides the field itself
                }
            }

            // 3. AND logic: both must pass
            if (regularConditionPasses && countConditionPasses) {
                visibleFields.add(field.id);
            }
        }

        return { visibleFields, disabledOptions };
    }, [fields, values, optionCounts]);
}
