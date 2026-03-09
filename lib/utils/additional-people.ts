import type {
    FormElement,
    SubmissionData,
    AdditionalPersonData,
} from "@/lib/types/registration-form";
import { getAllInputFields } from "@/lib/types/registration-form";

/**
 * Returns a Set of field names that are marked for additional people.
 */
export function getAPFieldNames(elements: FormElement[]): Set<string> {
    const names = new Set<string>();
    for (const field of getAllInputFields(elements)) {
        if (field.includeForAdditionalPeople === true) {
            names.add(field.name);
        }
    }
    return names;
}

/**
 * Builds a merged data object for an additional person:
 * - AP-marked fields use the person's values
 * - Non-AP fields use the main registrant's values
 */
export function buildMergedDataForAP(
    mainValues: SubmissionData,
    personValues: AdditionalPersonData,
    apFieldNames: Set<string>,
): SubmissionData {
    const merged: SubmissionData = {};
    for (const [key, value] of Object.entries(mainValues)) {
        if (apFieldNames.has(key)) {
            merged[key] = personValues[key] ?? "";
        } else {
            merged[key] = value;
        }
    }
    return merged;
}

/**
 * Safely extracts the additionalPeople array from submission data.
 */
export function getAdditionalPeople(data: Record<string, unknown>): AdditionalPersonData[] {
    const ap = data.additionalPeople;
    if (!Array.isArray(ap)) return [];
    return ap as AdditionalPersonData[];
}
