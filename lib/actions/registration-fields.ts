"use server";

import { requireEditor } from "@/lib/auth";
import { getFormStructure } from "@/lib/services/v2";
import {
    getRegistrationStatsForYear,
    getFilteredRegistrationStats,
    type RegistrationStats,
} from "@/lib/services/registration";
import type { StatFilter } from "@/lib/types/content-blocks";

export interface RegistrationFieldInfo {
    name: string;
    label: string;
    type: string;
    options?: string[];
}

const PRICING_FIELD_TYPES = new Set([
    "pricing_select",
    "pricing_multi_select",
    "pricing_quantity",
]);

export async function getRegistrationFields(
    yearId: string,
): Promise<RegistrationFieldInfo[]> {
    await requireEditor();

    const formStructure = await getFormStructure(yearId);
    if (!formStructure) return [];

    const pricingDefById = new Map(
        formStructure.pricingDefinitions.map((d) => [d.id, d]),
    );

    return formStructure.fields.map((f) => {
        let options: string[] | undefined;
        if (f.type === "checkbox") {
            options = ["Ano", "Ne"];
        } else if (f.type === "select" || f.type === "radio") {
            options =
                f.options.length > 0 ? f.options : undefined;
        } else if (
            PRICING_FIELD_TYPES.has(f.type) &&
            f.pricingDefinitionId
        ) {
            const def = pricingDefById.get(
                f.pricingDefinitionId,
            );
            options = def?.options.map((o) => o.name);
        }
        return {
            name: f.name,
            label: f.label,
            type: f.type,
            options,
        };
    });
}

export async function getRegistrationStatsPreview(
    yearId: string,
    filter?: Record<string, unknown>,
): Promise<RegistrationStats> {
    await requireEditor();
    if (filter) {
        return getFilteredRegistrationStats(
            yearId,
            filter as StatFilter,
        );
    }
    return getRegistrationStatsForYear(yearId);
}
