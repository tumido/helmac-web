"use client";

import { useMemo } from "react";
import type { FormField, SubmissionData } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";

/**
 * Returns a Set of field IDs that should be visible based on current form values.
 * Fields without conditions are always visible.
 */
export function useConditionalFields(
    fields: FormField[],
    values: SubmissionData
): Set<string> {
    return useMemo(() => {
        const visible = new Set<string>();

        for (const field of fields) {
            if (!isInputField(field) || !field.condition) {
                visible.add(field.id);
                continue;
            }

            const { fieldId, operator, value } = field.condition;

            // Find the target field to get its name
            const targetField = fields.find((f) => f.id === fieldId);
            if (!targetField || !isInputField(targetField)) {
                visible.add(field.id);
                continue;
            }

            const currentValue = String(values[targetField.name] ?? "");

            let match = false;
            if (operator === "equals") {
                match = currentValue === value;
            } else if (operator === "not_equals") {
                match = currentValue !== value;
            }

            if (match) {
                visible.add(field.id);
            }
        }

        return visible;
    }, [fields, values]);
}
