"use client";

import { useState, useCallback, useMemo, useActionState, type FormEvent } from "react";
import { Box, Button, Alert, Paper, Snackbar } from "@mui/material";
import type { RegistrationFormData, SubmissionData, OptionCounts, AdditionalPersonData } from "@/lib/types/registration-form";
import { isInputField, getAllFields, getAllInputFields, getAPInputFields, hasAdditionalPeopleFields } from "@/lib/types/registration-form";
import { DynamicFormField } from "./DynamicFormField";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { useConditionalFields, evaluateAPVisibleFields } from "./useConditionalFields";
import { AdditionalPeopleSection } from "./AdditionalPeopleSection";
import { PriceSummary } from "./PriceSummary";
import { buildMergedDataForAP, getAPFieldNames } from "@/lib/utils/additional-people";
import { submitDynamicRegistration, type RegistrationState } from "@/lib/actions/public/registration";

interface DynamicRegistrationFormProps {
    formData: RegistrationFormData;
    optionCounts?: OptionCounts;
    previewMode?: boolean;
}

function buildInitialValues(formData: RegistrationFormData): SubmissionData {
    const values: SubmissionData = {};
    const inputFields = getAllInputFields(formData.fields);
    for (const field of inputFields) {
        if (field.type === "checkbox") {
            values[field.name] = false;
        } else {
            values[field.name] = "";
        }
    }
    return values;
}

export function DynamicRegistrationForm({ formData, optionCounts, previewMode }: DynamicRegistrationFormProps) {
    const [values, setValues] = useState<SubmissionData>(() => buildInitialValues(formData));
    const [additionalPeople, setAdditionalPeople] = useState<AdditionalPersonData[]>([]);
    const { visibleFields } = useConditionalFields(formData, values, optionCounts);
    const [previewSnackbar, setPreviewSnackbar] = useState(false);

    const [state, formAction, isPending] = useActionState<RegistrationState | null, FormData>(
        submitDynamicRegistration,
        null
    );

    const handleChange = useCallback((name: string, value: string | number | boolean) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    }, []);

    const getFieldError = useCallback(
        (name: string): string | undefined => {
            return state?.errors?.[name]?.[0];
        },
        [state?.errors]
    );

    const handlePreviewSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        setPreviewSnackbar(true);
    }, []);

    // Flatten all fields for rendering (preserving order from elements)
    const allFields = getAllFields(formData.fields);
    const allInputFields = getAllInputFields(formData.fields);
    const showAPSection = hasAdditionalPeopleFields(formData.fields);
    const apFields = showAPSection ? getAPInputFields(formData.fields) : [];

    // Compute visible AP fields per person for price summary
    const visibleAPFieldsPerPerson = useMemo(() => {
        if (!showAPSection) return [];
        const apNames = getAPFieldNames(formData.fields);
        return additionalPeople.map((person) => {
            const merged = buildMergedDataForAP(values, person, apNames);
            return evaluateAPVisibleFields(formData, merged, optionCounts);
        });
    }, [showAPSection, additionalPeople, values, formData, optionCounts]);

    if (!previewMode && state?.success) {
        return <RegistrationSuccess message={state.message} />;
    }

    return (
        <Paper sx={{ p: { xs: 3, md: 5 } }}>
            {state?.message && !state.success && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {state.message}
                </Alert>
            )}

            <Box
                component="form"
                action={previewMode ? undefined : formAction}
                onSubmit={previewMode ? handlePreviewSubmit : undefined}
            >
                {/* Include checkbox values as hidden inputs for FormData */}
                {allInputFields.map((field) => {
                    if (field.type === "checkbox") {
                        return (
                            <input
                                key={`hidden-${field.name}`}
                                type="hidden"
                                name={field.name}
                                value={String(values[field.name] ?? false)}
                            />
                        );
                    }
                    return null;
                })}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    {allFields.map((field) => {
                        if (!visibleFields.has(field.id)) return null;

                        const value = isInputField(field) ? (values[field.name] ?? "") : "";

                        return (
                            <DynamicFormField
                                key={field.id}
                                field={field}
                                value={value}
                                error={isInputField(field) ? getFieldError(field.name) : undefined}
                                onChange={handleChange}
                                pricingDefinitions={formData.pricingDefinitions}
                            />
                        );
                    })}
                </Box>

                {showAPSection && (
                    <AdditionalPeopleSection
                        formData={formData}
                        apFields={apFields}
                        mainValues={values}
                        optionCounts={optionCounts}
                        people={additionalPeople}
                        onPeopleChange={setAdditionalPeople}
                        errors={state?.apErrors}
                    />
                )}

                {formData.pricingDefinitions.length > 0 && (
                    <PriceSummary
                        pricingDefinitions={formData.pricingDefinitions}
                        allInputFields={allInputFields}
                        mainValues={values}
                        additionalPeople={additionalPeople}
                        visibleMainFields={visibleFields}
                        visibleAPFieldsPerPerson={visibleAPFieldsPerPerson}
                    />
                )}

                <Box sx={{ mt: 4, textAlign: "center" }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        size="large"
                        disabled={!previewMode && isPending}
                        sx={{
                            px: 6,
                            py: 1.5,
                            fontSize: "1.1rem",
                        }}
                    >
                        {!previewMode && isPending
                            ? "Odesílám..."
                            : previewMode
                                ? "Odeslat registraci (náhled)"
                                : "Odeslat registraci"}
                    </Button>
                </Box>
            </Box>

            {previewMode && (
                <Snackbar
                    open={previewSnackbar}
                    autoHideDuration={4000}
                    onClose={() => setPreviewSnackbar(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity="info" onClose={() => setPreviewSnackbar(false)}>
                        Toto je pouze náhled. Registrace nebyla odeslána.
                    </Alert>
                </Snackbar>
            )}
        </Paper>
    );
}
