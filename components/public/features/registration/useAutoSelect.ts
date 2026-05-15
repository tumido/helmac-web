import { useEffect, type Dispatch, type SetStateAction } from "react";
import type {
    RegistrationFormData,
    SubmissionData,
    OptionCounts,
    AdditionalPersonData,
} from "@/lib/types/registration-form";
import { getAllInputFields } from "@/lib/types/registration-form";
import { getFieldRemainingInfo } from "@/lib/utils/quantity-remaining";

export function useAutoSelect(
    formData: RegistrationFormData,
    visibleFields: Set<string>,
    optionCounts: OptionCounts | undefined,
    additionalPeople: AdditionalPersonData[],
    setValues: Dispatch<SetStateAction<SubmissionData>>
) {
    useEffect(() => {
        const inputFields = getAllInputFields(formData.fields);
        const updates: Record<string, string> = {};

        for (const field of inputFields) {
            if (!visibleFields.has(field.id)) continue;

            if (field.type === "pricing_select" && field.pricingId) {
                const def = formData.pricingDefinitions.find(
                    (d) => d.id === field.pricingId
                );
                if (!def) continue;
                const { disabled } = getFieldRemainingInfo(
                    field,
                    formData.pricingDefinitions,
                    formData.capacityLimits,
                    optionCounts,
                    additionalPeople
                );
                const enabledOptions = def.options.filter(
                    (o) => !disabled.has(o.name)
                );
                if (enabledOptions.length === 1) {
                    updates[field.name] = enabledOptions[0].id;
                }
            } else if (
                field.type === "select" ||
                field.type === "radio"
            ) {
                if (!field.options || field.options.length === 0)
                    continue;
                const { disabled } = getFieldRemainingInfo(
                    field,
                    formData.pricingDefinitions,
                    formData.capacityLimits,
                    optionCounts,
                    additionalPeople
                );
                const enabledOptions = field.options.filter(
                    (o) => !disabled.has(o)
                );
                if (enabledOptions.length === 1) {
                    updates[field.name] = enabledOptions[0];
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            setValues((prev) => {
                const next = { ...prev };
                let changed = false;
                for (const [name, value] of Object.entries(
                    updates
                )) {
                    if (
                        prev[name] === "" ||
                        prev[name] === undefined
                    ) {
                        next[name] = value;
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }
    }, [
        visibleFields,
        formData,
        optionCounts,
        additionalPeople,
        setValues,
    ]);
}
