"use server";

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { buildSubmissionSchema } from "@/lib/validators/registration-submission";
import type { FormCondition, FormElement, FormField, InputField, OptionCounts, AdditionalPersonData } from "@/lib/types/registration-form";
import { isInputField, isConditionBlock, getAllFields, getAllInputFields, getAPInputFields, MAX_ADDITIONAL_PEOPLE } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getOptionCountsForYearFresh } from "@/lib/services/registration";
import { getAPFieldNames } from "@/lib/utils/additional-people";

export interface RegistrationState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    apErrors?: Record<number, Record<string, string[]>>;
    registrationId?: string;
}

/**
 * Evaluate whether a condition passes (all rules must be true = AND logic).
 */
function evaluateCondition(
    condition: FormCondition,
    rawData: Record<string, unknown>,
    allFields: FormField[],
    optionCounts?: OptionCounts,
): boolean {
    for (const rule of condition.rules) {
        if (rule.type === "field_value") {
            if (!rule.fieldId || rule.operator === undefined) return false;
            const targetField = allFields.find((f) => f.id === rule.fieldId);
            if (!targetField || !isInputField(targetField)) return false;

            const currentValue = String(rawData[targetField.name] ?? "");
            if (rule.operator === "equals" && currentValue !== rule.value) return false;
            if (rule.operator === "not_equals" && currentValue === rule.value) return false;
        } else if (rule.type === "capacity") {
            if (!rule.fieldId || !rule.value || rule.maxCount == null) return false;
            const targetField = allFields.find((f) => f.id === rule.fieldId);
            if (!targetField || !isInputField(targetField)) return false;

            if (optionCounts) {
                const currentCount = optionCounts[targetField.name]?.[rule.value] ?? 0;
                if (currentCount >= rule.maxCount) return false;
            }
        }
    }
    return true;
}

/**
 * Walk elements and build set of visible field IDs based on conditions.
 */
function buildVisibleFieldIds(
    elements: FormElement[],
    conditions: FormCondition[],
    rawData: Record<string, unknown>,
    allFields: FormField[],
    optionCounts?: OptionCounts,
): Set<string> {
    const visibleFieldIds = new Set<string>();
    const conditionMap = new Map(conditions.map((c) => [c.id, c]));

    for (const el of elements) {
        if (isConditionBlock(el)) {
            const condition = conditionMap.get(el.conditionId);
            if (!condition) continue;

            const passes = evaluateCondition(condition, rawData, allFields, optionCounts);
            if (passes) {
                for (const child of el.children) {
                    visibleFieldIds.add(child.id);
                }
            }
        } else {
            // Top-level fields are always visible
            visibleFieldIds.add(el.id);
        }
    }

    return visibleFieldIds;
}

export async function submitDynamicRegistration(
    prevState: RegistrationState | null,
    formData: FormData
): Promise<RegistrationState> {
    // Get active year with form
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false, registrationOpen: true },
        select: {
            id: true,
            title: true,
            registrationForm: {
                select: { id: true, fields: true },
            },
        },
    });

    if (!activeYear) {
        return {
            success: false,
            message: "Registrace není momentálně otevřena",
        };
    }

    if (!activeYear.registrationForm) {
        return {
            success: false,
            message: "Registrační formulář není nakonfigurován",
        };
    }

    const formDataStored = migrateFormData(activeYear.registrationForm.fields);
    const allFields = getAllFields(formDataStored.fields);
    const allInputFields = getAllInputFields(formDataStored.fields);

    // Build raw data from form
    const rawData: Record<string, unknown> = {};
    for (const field of allInputFields) {
        const value = formData.get(field.name);
        if (field.type === "checkbox") {
            rawData[field.name] = value === "true";
        } else if (field.type === "number") {
            rawData[field.name] = value ? Number(value) : "";
        } else {
            rawData[field.name] = value ?? "";
        }
    }

    // Evaluate conditions — check if any condition uses capacity rules
    const hasCapacityRules = formDataStored.conditions.some(
        (c) => c.rules.some((r) => r.type === "capacity")
    );
    let optionCounts: OptionCounts | undefined;

    if (hasCapacityRules) {
        optionCounts = await getOptionCountsForYearFresh(activeYear.id);
    }

    // Build visible field IDs
    const visibleFieldIds = buildVisibleFieldIds(
        formDataStored.fields,
        formDataStored.conditions,
        rawData,
        allFields,
        optionCounts,
    );

    // Only validate visible input fields
    const visibleInputFields = allInputFields.filter(
        (f) => visibleFieldIds.has(f.id)
    );

    // Build schema from visible fields only
    const schema = buildSubmissionSchema(visibleInputFields);
    const visibleRawData: Record<string, unknown> = {};
    for (const field of visibleInputFields) {
        visibleRawData[field.name] = rawData[field.name];
    }

    const result = schema.safeParse(visibleRawData);

    if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) errors[path] = [];
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Prosím opravte chyby ve formuláři",
            errors,
        };
    }

    // --- Additional People validation ---
    const apFieldNames = getAPFieldNames(formDataStored.fields);
    const apInputFields = getAPInputFields(formDataStored.fields);
    let parsedAP: AdditionalPersonData[] = [];
    const apErrors: Record<number, Record<string, string[]>> = {};

    const rawAPJson = formData.get("__additionalPeople");
    if (rawAPJson && String(rawAPJson) !== "[]") {
        try {
            const parsed = JSON.parse(String(rawAPJson));
            if (!Array.isArray(parsed)) {
                return {
                    success: false,
                    message: "Neplatná data dalších osob",
                };
            }
            if (parsed.length > MAX_ADDITIONAL_PEOPLE) {
                return {
                    success: false,
                    message: `Maximální počet dalších osob je ${MAX_ADDITIONAL_PEOPLE}`,
                };
            }
            parsedAP = parsed;
        } catch {
            return {
                success: false,
                message: "Neplatná data dalších osob",
            };
        }

        for (let i = 0; i < parsedAP.length; i++) {
            const person = parsedAP[i];

            // Build merged data for condition evaluation
            const mergedRaw: Record<string, unknown> = {};
            for (const field of allInputFields) {
                if (apFieldNames.has(field.name)) {
                    mergedRaw[field.name] = person[field.name] ?? "";
                } else {
                    mergedRaw[field.name] = rawData[field.name];
                }
            }

            // Evaluate conditions with merged data
            const apVisibleFieldIds = buildVisibleFieldIds(
                formDataStored.fields,
                formDataStored.conditions,
                mergedRaw,
                allFields,
                optionCounts,
            );

            // Get visible AP fields for this person
            const visibleAPFields = apInputFields.filter(
                (f) => apVisibleFieldIds.has(f.id)
            );

            // Type-convert AP values
            const typedPersonData: Record<string, unknown> = {};
            for (const field of visibleAPFields) {
                const val = person[field.name];
                if (field.type === "checkbox") {
                    typedPersonData[field.name] = val === true || val === "true";
                } else if (field.type === "number") {
                    typedPersonData[field.name] = val !== undefined && val !== "" ? Number(val) : "";
                } else {
                    typedPersonData[field.name] = val ?? "";
                }
            }

            // Validate with schema
            const apSchema = buildSubmissionSchema(visibleAPFields);
            const apResult = apSchema.safeParse(typedPersonData);

            if (!apResult.success) {
                apErrors[i] = {};
                apResult.error.issues.forEach((issue) => {
                    const path = issue.path.join(".");
                    if (!apErrors[i][path]) apErrors[i][path] = [];
                    apErrors[i][path].push(issue.message);
                });
            }

            // Store only visible AP field values
            const cleanedPerson: AdditionalPersonData = {};
            for (const field of visibleAPFields) {
                cleanedPerson[field.name] = typedPersonData[field.name] as string | number | boolean;
            }
            parsedAP[i] = cleanedPerson;
        }

        if (Object.keys(apErrors).length > 0) {
            return {
                success: false,
                message: "Prosím opravte chyby ve formuláři",
                errors: result.success ? undefined : undefined,
                apErrors,
            };
        }
    }

    // Build submission data (visible fields only, hidden fields stripped)
    const submissionData: Record<string, unknown> = {};
    for (const field of allInputFields) {
        if (visibleFieldIds.has(field.id)) {
            submissionData[field.name] = rawData[field.name];
        }
    }

    // Include additional people data if present
    if (parsedAP.length > 0) {
        submissionData.additionalPeople = parsedAP;
    }

    // Duplicate check: find email-type field
    const emailField = allInputFields.find(
        (f): f is InputField => f.type === "email"
    );

    if (emailField) {
        const emailValue = String(submissionData[emailField.name] || "").toLowerCase();
        if (emailValue) {
            const existing = await db.registrationSubmission.findFirst({
                where: {
                    yearId: activeYear.id,
                    data: {
                        path: [emailField.name],
                        equals: emailValue,
                    },
                },
                select: { id: true },
            });

            if (existing) {
                return {
                    success: false,
                    message: "Na tento email již existuje registrace",
                    errors: {
                        [emailField.name]: ["Na tento email již existuje registrace"],
                    },
                };
            }
        }
    }

    // Normalize email value to lowercase in submission
    if (emailField && submissionData[emailField.name]) {
        submissionData[emailField.name] = String(submissionData[emailField.name]).toLowerCase();
    }

    // Create submission
    try {
        const submission = await db.registrationSubmission.create({
            data: {
                yearId: activeYear.id,
                formId: activeYear.registrationForm.id,
                data: submissionData as Prisma.InputJsonValue,
                status: "PENDING",
            },
        });

        return {
            success: true,
            message: `Děkujeme za registraci na ${activeYear.title}!`,
            registrationId: submission.id,
        };
    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            message: "Nastala chyba při zpracování registrace. Zkuste to prosím znovu.",
        };
    }
}
