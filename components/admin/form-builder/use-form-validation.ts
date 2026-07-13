"use client";

import { useCallback } from "react";
import type {
    CapacityLimit,
    FormCondition,
    FormField,
    InfoStatsConfig,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import type {
    ConditionalEmailInfo,
    FieldExternalUsage,
} from "@/lib/utils/condition-validation";
import {
    getBrokenOptionRemovals,
    getConditionalEmailsUsingField,
    getConditionalEmailsUsingOptionValue,
    getConditionsUsingField,
    getFieldExternalUsages,
} from "@/lib/utils/condition-validation";
import { getFieldOptionValues } from "@/lib/utils/pricing";
import type { DeletionBlockInfo } from "./form-builder-dialogs";

interface UsageContext {
    conditions: FormCondition[];
    pricingDefinitions: PricingDefinition[];
    capacityLimits: CapacityLimit[];
    showOptionCounts: string[];
    emailFieldNames: Set<string>;
    infoStatsConfig: InfoStatsConfig | undefined;
    conditionalEmails: ConditionalEmailInfo[];
}

/**
 * Pure: returns null if the field can be deleted, otherwise a structured
 * "blocked" message listing every usage that prevents deletion.
 */
export function reasonsToBlockFieldDelete(
    field: FormField | undefined,
    ctx: UsageContext
): DeletionBlockInfo | null {
    if (!field) return null;
    const details: string[] = [];

    for (const u of getConditionsUsingField(field.id, ctx.conditions)) {
        details.push(`Podmínka: „${u.conditionName}"`);
    }
    for (const u of getConditionalEmailsUsingField(
        field.id,
        ctx.conditionalEmails
    )) {
        details.push(`Podmíněný email: „${u.emailName}"`);
    }
    if (isInputField(field)) {
        const externals: FieldExternalUsage[] = getFieldExternalUsages(
            field.id,
            field.name,
            ctx.capacityLimits,
            ctx.showOptionCounts,
            ctx.emailFieldNames,
            ctx.infoStatsConfig
        );
        for (const u of externals) details.push(u.label);
    }

    if (details.length === 0) return null;
    return {
        title: "Nelze smazat pole",
        message: "Pole je používáno v:",
        details,
    };
}

/**
 * Pure: returns null if the option-bearing update is safe, otherwise a
 * structured "blocked" message listing every reference that would break.
 *
 * Covers two paths:
 *   1. Options edited in-place on a select/radio/pricing field.
 *   2. Field type changed from an option-bearing kind to a non-option-bearing
 *      kind (e.g. radio → text) — all previous options become "removed".
 */
export function reasonsToBlockFieldSave(
    original: FormField | null,
    updated: FormField,
    ctx: UsageContext
): DeletionBlockInfo | null {
    if (!original || !isInputField(original)) return null;
    const originalHasOptions =
        "options" in original || "pricingId" in original;
    if (!originalHasOptions) return null;

    const oldOpts = getFieldOptionValues(original, ctx.pricingDefinitions);
    if (oldOpts.length === 0) return null;
    const newOpts = isInputField(updated)
        ? getFieldOptionValues(updated, ctx.pricingDefinitions)
        : [];

    const newSet = new Set(newOpts);
    const details: string[] = [];

    for (const b of getBrokenOptionRemovals(
        updated.id,
        oldOpts,
        newOpts,
        ctx.conditions
    )) {
        details.push(`„${b.removedValue}" v podmínce „${b.conditionName}"`);
    }
    for (const opt of oldOpts) {
        if (newSet.has(opt)) continue;
        for (const u of getConditionalEmailsUsingOptionValue(
            updated.id,
            opt,
            ctx.conditionalEmails
        )) {
            details.push(`„${opt}" v podmíněném emailu „${u.emailName}"`);
        }
    }

    if (details.length === 0) return null;
    return {
        title: "Nelze uložit změny",
        message: "Odebrané možnosti jsou používány:",
        details,
    };
}

/** Convenience hook: bind the context once and call the pure validators by reference. */
export function useFormValidation(ctx: UsageContext) {
    return {
        checkDelete: useCallback(
            (field: FormField | undefined) =>
                reasonsToBlockFieldDelete(field, ctx),
            [ctx]
        ),
        checkSave: useCallback(
            (original: FormField | null, updated: FormField) =>
                reasonsToBlockFieldSave(original, updated, ctx),
            [ctx]
        ),
    };
}
