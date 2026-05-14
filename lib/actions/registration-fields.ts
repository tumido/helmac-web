"use server";

import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { getAllInputFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getFieldOptionValues } from "@/lib/utils/pricing";
import {
    getRegistrationStatsForYear,
    type RegistrationStats,
} from "@/lib/services/registration";

export interface RegistrationFieldInfo {
    name: string;
    label: string;
    type: string;
    options?: string[];
}

export async function getRegistrationFields(
    yearId: string
): Promise<RegistrationFieldInfo[]> {
    await requireEditor();

    const form = await db.registrationForm.findUnique({
        where: { yearId },
        select: { fields: true },
    });
    if (!form) return [];

    const formData = migrateFormData(form.fields);
    const inputFields = getAllInputFields(formData.fields);

    return inputFields.map((f) => {
        const options =
            f.type === "checkbox"
                ? ["Ano", "Ne"]
                : getFieldOptionValues(
                      f,
                      formData.pricingDefinitions
                  );
        return {
            name: f.name,
            label: f.label,
            type: f.type,
            options:
                options.length > 0 ? options : undefined,
        };
    });
}

export async function getRegistrationStatsPreview(
    yearId: string,
    filter?: Record<string, unknown>
): Promise<RegistrationStats> {
    await requireEditor();
    if (filter) {
        const { getFilteredRegistrationStats } =
            await import("@/lib/services/registration");
        return getFilteredRegistrationStats(
            yearId,
            filter as import("@/lib/types/content-blocks").StatFilter
        );
    }
    return getRegistrationStatsForYear(yearId);
}
