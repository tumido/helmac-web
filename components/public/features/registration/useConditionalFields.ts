"use client";

import { useMemo } from "react";
import type { RegistrationFormData, SubmissionData } from "@/lib/types/registration-form";
import { isConditionBlock, getAllFields } from "@/lib/types/registration-form";
import { evaluateCondition } from "@/lib/utils/condition-evaluation";

export interface ConditionalFieldsResult {
    visibleFields: Set<string>;
}

export { evaluateCondition };

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

                const passes = evaluateCondition(
                    condition,
                    values,
                    allFields,
                    formData.pricingDefinitions,
                );
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

            const passes = evaluateCondition(
                condition,
                mergedValues,
                allFields,
                formData.pricingDefinitions,
            );
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
