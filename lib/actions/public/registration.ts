"use server";

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { buildSubmissionSchema } from "@/lib/validators/registration-submission";
import type { FormField, InputField, OptionCounts } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { getOptionCountsForYearFresh } from "@/lib/services/registration";

export interface RegistrationState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    registrationId?: string;
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

    const fields = activeYear.registrationForm.fields as unknown as FormField[];

    // Build raw data from form
    const rawData: Record<string, unknown> = {};
    for (const field of fields) {
        if (!isInputField(field)) continue;

        const value = formData.get(field.name);
        if (field.type === "checkbox") {
            rawData[field.name] = value === "true";
        } else if (field.type === "number") {
            rawData[field.name] = value ? Number(value) : "";
        } else {
            rawData[field.name] = value ?? "";
        }
    }

    // Evaluate conditional logic server-side — strip hidden field values
    const visibleFieldIds = new Set<string>();
    for (const field of fields) {
        if (!isInputField(field) || !field.condition) {
            visibleFieldIds.add(field.id);
            continue;
        }

        const targetField = fields.find((f) => f.id === field.condition!.fieldId);
        if (!targetField || !isInputField(targetField)) {
            visibleFieldIds.add(field.id);
            continue;
        }

        const currentValue = String(rawData[targetField.name] ?? "");
        const { operator, value } = field.condition;

        let match = false;
        if (operator === "equals") match = currentValue === value;
        else if (operator === "not_equals") match = currentValue !== value;

        if (match) {
            visibleFieldIds.add(field.id);
        }
    }

    // Evaluate count conditions (fresh DB query, no cache)
    const hasCountConditions = fields.some(
        (f) => isInputField(f) && f.countCondition
    );
    let optionCounts: OptionCounts | undefined;
    const disabledOptionsByName: Record<string, Set<string>> = {};

    if (hasCountConditions) {
        optionCounts = await getOptionCountsForYearFresh(activeYear.id);

        for (const field of fields) {
            if (!isInputField(field) || !field.countCondition) continue;
            const cc = field.countCondition;

            if (cc.action === "hide_field" && cc.fieldId && cc.value && cc.maxCount != null) {
                const targetField = fields.find((f) => f.id === cc.fieldId);
                if (targetField && isInputField(targetField)) {
                    const currentCount = optionCounts[targetField.name]?.[cc.value] ?? 0;
                    if (currentCount >= cc.maxCount) {
                        visibleFieldIds.delete(field.id);
                    }
                }
            }

            if (cc.action === "disable_option" && cc.optionLimits) {
                for (const limit of cc.optionLimits) {
                    const currentCount = optionCounts[field.name]?.[limit.value] ?? 0;
                    if (currentCount >= limit.maxCount) {
                        if (!disabledOptionsByName[field.name]) {
                            disabledOptionsByName[field.name] = new Set();
                        }
                        disabledOptionsByName[field.name].add(limit.value);
                    }
                }
            }
        }
    }

    // Only validate visible input fields
    const visibleInputFields = fields.filter(
        (f) => isInputField(f) && visibleFieldIds.has(f.id)
    );

    // Build schema from visible fields only
    const schema = buildSubmissionSchema(visibleInputFields);
    const visibleRawData: Record<string, unknown> = {};
    for (const field of visibleInputFields) {
        if (isInputField(field)) {
            visibleRawData[field.name] = rawData[field.name];
        }
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

    // Check submitted values against disabled options (capacity limits)
    for (const [fieldName, disabledValues] of Object.entries(disabledOptionsByName)) {
        const submitted = String(visibleRawData[fieldName] ?? "");
        if (submitted && disabledValues.has(submitted)) {
            return {
                success: false,
                message: "Zvolená možnost je již obsazena. Načtěte formulář znovu.",
                errors: { [fieldName]: ["Tato možnost je již obsazena"] },
            };
        }
    }

    // Build submission data (visible fields only, hidden fields stripped)
    const submissionData: Record<string, unknown> = {};
    for (const field of fields) {
        if (!isInputField(field)) continue;
        if (visibleFieldIds.has(field.id)) {
            submissionData[field.name] = rawData[field.name];
        }
    }

    // Duplicate check: find email-type field
    const emailField = fields.find(
        (f): f is InputField => isInputField(f) && f.type === "email"
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
