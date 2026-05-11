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
                const currentValue = String(values[targetField.name] ?? "");

                let parsedArr: unknown[] | null = null;
                if (targetField.type === "pricing_multi_select" && currentValue.startsWith("[")) {
                    try {
                        const arr = JSON.parse(currentValue);
                        if (Array.isArray(arr)) parsedArr = arr;
                    } catch { /* ignore */ }
                }

                if (rule.operator === "is_set" || rule.operator === "is_not_set") {
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
