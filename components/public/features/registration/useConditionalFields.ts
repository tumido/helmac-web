"use client";

import { useMemo } from "react";
import type { RegistrationFormData, SubmissionData, FormCondition, FormField } from "@/lib/types/registration-form";
import { isInputField, isConditionBlock, getAllFields } from "@/lib/types/registration-form";

export interface ConditionalFieldsResult {
    visibleFields: Set<string>;
}

export function evaluateCondition(
    condition: FormCondition,
    values: SubmissionData,
    allFields: FormField[],
): boolean {
    for (const rule of condition.rules) {
        if (!rule.fieldId || rule.operator === undefined) return false;
        const targetField = allFields.find((f) => f.id === rule.fieldId);
        if (!targetField || !isInputField(targetField)) return false;

        const currentValue = String(values[targetField.name] ?? "");
        if (rule.operator === "equals" && currentValue !== rule.value) return false;
        if (rule.operator === "not_equals" && currentValue === rule.value) return false;
    }
    return true;
}

/**
 * Returns visible field IDs based on current form values and conditions.
 */
export function useConditionalFields(
    formData: RegistrationFormData,
    values: SubmissionData,
): ConditionalFieldsResult {
    return useMemo(() => {
        const visibleFields = new Set<string>();
        const allFields = getAllFields(formData.fields);
        const conditionMap = new Map(formData.conditions.map((c) => [c.id, c]));

        for (const el of formData.fields) {
            if (isConditionBlock(el)) {
                const condition = conditionMap.get(el.conditionId);
                if (!condition) continue;

                const passes = evaluateCondition(condition, values, allFields);
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
    }, [formData, values]);
}

/**
 * Evaluates which fields are visible for an additional person.
 * Uses merged values (AP fields from person, rest from main registrant).
 * Plain function (not a hook) — can be called in a loop.
 */
export function evaluateAPVisibleFields(
    formData: RegistrationFormData,
    mergedValues: SubmissionData,
): Set<string> {
    const visibleFields = new Set<string>();
    const allFields = getAllFields(formData.fields);
    const conditionMap = new Map(formData.conditions.map((c) => [c.id, c]));

    for (const el of formData.fields) {
        if (isConditionBlock(el)) {
            const condition = conditionMap.get(el.conditionId);
            if (!condition) continue;

            const passes = evaluateCondition(condition, mergedValues, allFields);
            if (passes) {
                for (const child of el.children) {
                    visibleFields.add(child.id);
                }
            }
        } else {
            visibleFields.add(el.id);
        }
    }

    return visibleFields;
}
