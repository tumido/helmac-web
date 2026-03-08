"use client";

import { useMemo } from "react";
import type { RegistrationFormData, SubmissionData, OptionCounts, FormCondition, FormField } from "@/lib/types/registration-form";
import { isInputField, isConditionBlock, getAllFields } from "@/lib/types/registration-form";

export interface ConditionalFieldsResult {
    visibleFields: Set<string>;
}

function evaluateCondition(
    condition: FormCondition,
    values: SubmissionData,
    allFields: FormField[],
    optionCounts?: OptionCounts,
): boolean {
    for (const rule of condition.rules) {
        if (rule.type === "field_value") {
            if (!rule.fieldId || rule.operator === undefined) return false;
            const targetField = allFields.find((f) => f.id === rule.fieldId);
            if (!targetField || !isInputField(targetField)) return false;

            const currentValue = String(values[targetField.name] ?? "");
            if (rule.operator === "equals" && currentValue !== rule.value) return false;
            if (rule.operator === "not_equals" && currentValue === rule.value) return false;
        } else if (rule.type === "capacity") {
            if (!rule.fieldId || !rule.value || rule.maxCount == null) return false;
            const targetField = allFields.find((f) => f.id === rule.fieldId);
            if (!targetField || !isInputField(targetField)) return false;

            if (optionCounts) {
                const currentCount = optionCounts[targetField.name]?.[rule.value] ?? 0;
                if (currentCount >= rule.maxCount) return false;
            }
        }
    }
    return true;
}

/**
 * Returns visible field IDs based on current form values and conditions.
 */
export function useConditionalFields(
    formData: RegistrationFormData,
    values: SubmissionData,
    optionCounts?: OptionCounts,
): ConditionalFieldsResult {
    return useMemo(() => {
        const visibleFields = new Set<string>();
        const allFields = getAllFields(formData.fields);
        const conditionMap = new Map(formData.conditions.map((c) => [c.id, c]));

        for (const el of formData.fields) {
            if (isConditionBlock(el)) {
                const condition = conditionMap.get(el.conditionId);
                if (!condition) continue;

                const passes = evaluateCondition(condition, values, allFields, optionCounts);
                if (passes) {
                    for (const child of el.children) {
                        visibleFields.add(child.id);
                    }
                }
            } else {
                // Top-level fields are always visible
                visibleFields.add(el.id);
            }
        }

        return { visibleFields };
    }, [formData, values, optionCounts]);
}
