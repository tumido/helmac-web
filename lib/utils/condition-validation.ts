import type {
    FormCondition,
    FormElement,
    ConditionBlock,
    CapacityLimit,
    InfoStatsConfig,
} from "@/lib/types/registration-form";
import { isConditionBlock } from "@/lib/types/registration-form";

export interface FieldExternalUsage {
    label: string; // "Email", "Limit", "Statistiky", "Info statistiky"
    color: "warning" | "secondary" | "success" | "info";
}

/** Returns external usages (email, capacity limit, stats, info stats) for a given field */
export function getFieldExternalUsages(
    fieldId: string,
    fieldName: string,
    capacityLimits: CapacityLimit[],
    showOptionCounts: string[],
    emailFieldNames: Set<string>,
    infoStatsConfig?: InfoStatsConfig
): FieldExternalUsage[] {
    const usages: FieldExternalUsage[] = [];

    if (emailFieldNames.has(fieldName)) {
        usages.push({ label: "Email", color: "warning" });
    }

    if (capacityLimits.some((l) => l.fieldId === fieldId)) {
        usages.push({ label: "Limit", color: "secondary" });
    }

    if (showOptionCounts.includes(fieldId)) {
        usages.push({ label: "Statistiky", color: "success" });
    }

    if (
        infoStatsConfig?.stats.some(
            (s) => s.fieldIds.includes(fieldId) || s.personFieldId === fieldId
        )
    ) {
        usages.push({ label: "Info statistiky", color: "info" });
    }

    return usages;
}

export interface ConditionUsageInfo {
    conditionId: string;
    conditionName: string;
}

/** Finds conditions whose rules reference a given field ID */
export function getConditionsUsingField(
    fieldId: string,
    conditions: FormCondition[]
): ConditionUsageInfo[] {
    return conditions
        .filter((c) => c.rules.some((r) => r.fieldId === fieldId))
        .map((c) => ({
            conditionId: c.id,
            conditionName: c.name || "(nepojmenovaná)",
        }));
}

/** Finds conditions whose rules reference a specific option value on a specific field */
export function getConditionsUsingOptionValue(
    fieldId: string,
    value: string,
    conditions: FormCondition[]
): ConditionUsageInfo[] {
    return conditions
        .filter((c) =>
            c.rules.some((r) => r.fieldId === fieldId && r.value === value)
        )
        .map((c) => ({
            conditionId: c.id,
            conditionName: c.name || "(nepojmenovaná)",
        }));
}

/** Finds condition blocks that reference a given condition ID */
export function getBlocksUsingCondition(
    conditionId: string,
    elements: FormElement[]
): ConditionBlock[] {
    return elements.filter(
        (el): el is ConditionBlock =>
            isConditionBlock(el) && el.conditionId === conditionId
    );
}

/** Diffs old vs new options and returns those whose removal would break conditions */
export function getBrokenOptionRemovals(
    fieldId: string,
    originalOptions: string[],
    newOptions: string[],
    conditions: FormCondition[]
): { removedValue: string; conditionName: string }[] {
    const newSet = new Set(newOptions);
    const result: { removedValue: string; conditionName: string }[] = [];

    for (const opt of originalOptions) {
        if (newSet.has(opt)) continue;
        const usages = getConditionsUsingOptionValue(fieldId, opt, conditions);
        for (const usage of usages) {
            result.push({
                removedValue: opt,
                conditionName: usage.conditionName,
            });
        }
    }

    return result;
}

// --- Conditional email guards ---

export interface ConditionalEmailUsage {
    emailId: string;
    emailName: string;
}

export interface ConditionalEmailInfo {
    id: string;
    name: string;
    conditionFieldId: string;
    conditionValue: string;
}

/** Returns conditional emails that use the given field ID as their condition */
export function getConditionalEmailsUsingField(
    fieldId: string,
    conditionalEmails: ConditionalEmailInfo[]
): ConditionalEmailUsage[] {
    return conditionalEmails
        .filter((e) => e.conditionFieldId === fieldId)
        .map((e) => ({ emailId: e.id, emailName: e.name }));
}

/** Returns conditional emails that use a specific option value on a field as condition */
export function getConditionalEmailsUsingOptionValue(
    fieldId: string,
    value: string,
    conditionalEmails: ConditionalEmailInfo[]
): ConditionalEmailUsage[] {
    return conditionalEmails
        .filter(
            (e) => e.conditionFieldId === fieldId && e.conditionValue === value
        )
        .map((e) => ({ emailId: e.id, emailName: e.name }));
}

/** Returns all field IDs referenced by any condition rule */
export function getFieldIdsUsedInConditions(
    conditions: FormCondition[]
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
