import type { FormCondition, FormElement, ConditionBlock } from "@/lib/types/registration-form";
import { isConditionBlock } from "@/lib/types/registration-form";

export interface ConditionUsageInfo {
    conditionId: string;
    conditionName: string;
}

/** Finds conditions whose rules reference a given field ID */
export function getConditionsUsingField(
    fieldId: string,
    conditions: FormCondition[],
): ConditionUsageInfo[] {
    return conditions
        .filter((c) => c.rules.some((r) => r.fieldId === fieldId))
        .map((c) => ({ conditionId: c.id, conditionName: c.name || "(nepojmenovaná)" }));
}

/** Finds conditions whose rules reference a specific option value on a specific field */
export function getConditionsUsingOptionValue(
    fieldId: string,
    value: string,
    conditions: FormCondition[],
): ConditionUsageInfo[] {
    return conditions
        .filter((c) =>
            c.rules.some((r) => r.fieldId === fieldId && r.value === value),
        )
        .map((c) => ({ conditionId: c.id, conditionName: c.name || "(nepojmenovaná)" }));
}

/** Finds condition blocks that reference a given condition ID */
export function getBlocksUsingCondition(
    conditionId: string,
    elements: FormElement[],
): ConditionBlock[] {
    return elements.filter(
        (el): el is ConditionBlock =>
            isConditionBlock(el) && el.conditionId === conditionId,
    );
}

/** Diffs old vs new options and returns those whose removal would break conditions */
export function getBrokenOptionRemovals(
    fieldId: string,
    originalOptions: string[],
    newOptions: string[],
    conditions: FormCondition[],
): { removedValue: string; conditionName: string }[] {
    const newSet = new Set(newOptions);
    const result: { removedValue: string; conditionName: string }[] = [];

    for (const opt of originalOptions) {
        if (newSet.has(opt)) continue;
        const usages = getConditionsUsingOptionValue(fieldId, opt, conditions);
        for (const usage of usages) {
            result.push({ removedValue: opt, conditionName: usage.conditionName });
        }
    }

    return result;
}

/** Returns all field IDs referenced by any condition rule */
export function getFieldIdsUsedInConditions(
    conditions: FormCondition[],
): Set<string> {
    const ids = new Set<string>();
    for (const c of conditions) {
        for (const r of c.rules) {
            if (r.fieldId) {
                ids.add(r.fieldId);
            }
        }
    }
    return ids;
}
