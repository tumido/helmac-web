import type {
    FormCondition,
    FormElement,
    FormField,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { isConditionBlock } from "@/lib/types/registration-form";
import { evaluateCondition } from "@/lib/utils/condition-evaluation";

export function buildVisibleFieldIds(
    elements: FormElement[],
    conditions: FormCondition[],
    rawData: Record<string, unknown>,
    allFields: FormField[],
    pricingDefinitions?: PricingDefinition[],
): Set<string> {
    const visibleFieldIds = new Set<string>();
    const conditionMap = new Map(conditions.map((c) => [c.id, c]));

    for (const el of elements) {
        if (isConditionBlock(el)) {
            const condition = conditionMap.get(el.conditionId);
            if (!condition) continue;

            const passes = evaluateCondition(
                condition,
                rawData,
                allFields,
                pricingDefinitions,
            );
            if (passes) {
                for (const child of el.children) {
                    visibleFieldIds.add(child.id);
                }
            }
        } else {
            visibleFieldIds.add(el.id);
        }
    }

    return visibleFieldIds;
}
