import { useState, useCallback, useMemo } from "react";
import type {
    RegistrationFormData,
    SubmissionData,
    AdditionalPersonData,
    InputField,
} from "@/lib/types/registration-form";
import {
    buildMergedDataForAP,
    getAPFieldNames,
} from "@/lib/utils/additional-people";
import { evaluateAPVisibleFields } from "./useConditionalFields";
import { buildSubmissionSchema } from "@/lib/validators/registration-submission";

interface UseFormValidationParams {
    allInputFields: InputField[];
    apFields: InputField[];
    visibleFields: Set<string>;
    values: SubmissionData;
    additionalPeople: AdditionalPersonData[];
    formData: RegistrationFormData;
    showAPSection: boolean;
    isLoggedIn?: boolean;
    previewMode?: boolean;
    gdprConsent: boolean;
    serverErrors?: Record<string, string[]>;
}

export interface ValidationSummaryData {
    main: string[];
    people: { label: string; fields: string[] }[];
}

function parseZodErrors(
    result: ReturnType<ReturnType<typeof buildSubmissionSchema>["safeParse"]>
): Record<string, string[]> {
    if (result.success) return {};
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
    }
    return errors;
}

export function useFormValidation({
    allInputFields,
    apFields,
    visibleFields,
    values,
    additionalPeople,
    formData,
    showAPSection,
    isLoggedIn,
    previewMode,
    gdprConsent,
    serverErrors,
}: UseFormValidationParams) {
    const [touched, setTouched] = useState<Set<string>>(new Set());

    const markTouched = useCallback((name: string) => {
        setTouched((prev) => {
            if (prev.has(name)) return prev;
            const next = new Set(prev);
            next.add(name);
            return next;
        });
    }, []);

    const allRequiredFilled = useMemo(() => {
        for (const field of allInputFields) {
            if (!field.required || !visibleFields.has(field.id))
                continue;
            const val = values[field.name];
            if (val === undefined || val === "" || val === false)
                return false;
        }
        if (!isLoggedIn && !previewMode && !gdprConsent) return false;
        return true;
    }, [
        allInputFields,
        visibleFields,
        values,
        isLoggedIn,
        previewMode,
        gdprConsent,
    ]);

    const clientErrors = useMemo(() => {
        const visibleInputFields = allInputFields.filter((f) =>
            visibleFields.has(f.id)
        );
        const schema = buildSubmissionSchema(visibleInputFields);
        const data: Record<string, unknown> = {};
        for (const field of visibleInputFields) {
            data[field.name] = values[field.name];
        }
        return parseZodErrors(schema.safeParse(data));
    }, [allInputFields, visibleFields, values]);

    const visibleAPFieldsPerPerson = useMemo(() => {
        if (!showAPSection) return [];
        const apNames = getAPFieldNames(formData.fields);
        return additionalPeople.map((person) => {
            const merged = buildMergedDataForAP(
                values,
                person,
                apNames
            );
            return evaluateAPVisibleFields(formData, merged);
        });
    }, [showAPSection, additionalPeople, values, formData]);

    const apClientErrors = useMemo(() => {
        if (!showAPSection || additionalPeople.length === 0)
            return {};
        const errors: Record<number, Record<string, string[]>> = {};
        for (let i = 0; i < additionalPeople.length; i++) {
            const visibleIds = visibleAPFieldsPerPerson[i];
            if (!visibleIds) continue;
            const visible = apFields.filter((f) =>
                visibleIds.has(f.id)
            );
            const schema = buildSubmissionSchema(visible);
            const data: Record<string, unknown> = {};
            for (const field of visible) {
                data[field.name] =
                    additionalPeople[i][field.name];
            }
            const result = schema.safeParse(data);
            if (!result.success) {
                errors[i] = {};
                for (const issue of result.error.issues) {
                    const key = String(issue.path[0]);
                    if (!errors[i][key]) errors[i][key] = [];
                    errors[i][key].push(issue.message);
                }
            }
        }
        return errors;
    }, [
        showAPSection,
        additionalPeople,
        apFields,
        visibleAPFieldsPerPerson,
    ]);

    const canSubmit = useMemo(
        () =>
            allRequiredFilled &&
            Object.keys(clientErrors).length === 0 &&
            Object.keys(apClientErrors).length === 0,
        [allRequiredFilled, clientErrors, apClientErrors]
    );

    const validationSummary = useMemo<ValidationSummaryData>(() => {
        const main: string[] = [];
        const errorNames = new Set(Object.keys(clientErrors));
        for (const field of allInputFields) {
            if (errorNames.has(field.name)) {
                main.push(field.label);
            }
        }
        if (!isLoggedIn && !previewMode && !gdprConsent) {
            main.push("Souhlas s GDPR");
        }
        const people: { label: string; fields: string[] }[] = [];
        for (const [idx, personErrors] of Object.entries(
            apClientErrors
        )) {
            const personNum = Number(idx) + 2;
            const fieldLabels = Object.keys(personErrors)
                .map(
                    (name) =>
                        apFields.find((f) => f.name === name)
                            ?.label
                )
                .filter((l): l is string => !!l);
            if (fieldLabels.length > 0) {
                people.push({
                    label: `Osoba č. ${personNum}`,
                    fields: fieldLabels,
                });
            }
        }
        return { main, people };
    }, [
        clientErrors,
        allInputFields,
        apClientErrors,
        apFields,
        isLoggedIn,
        previewMode,
        gdprConsent,
    ]);

    const getFieldError = useCallback(
        (name: string): string | undefined => {
            const serverError = serverErrors?.[name]?.[0];
            if (serverError) return serverError;
            if (touched.has(name))
                return clientErrors[name]?.[0];
            return undefined;
        },
        [serverErrors, clientErrors, touched]
    );

    return {
        canSubmit,
        validationSummary,
        getFieldError,
        markTouched,
        visibleAPFieldsPerPerson,
    };
}
