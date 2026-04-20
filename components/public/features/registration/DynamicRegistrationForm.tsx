"use client";

import { useState, useCallback, useMemo, useEffect, useActionState, type FormEvent } from "react";
import { Box, Button, Alert, Paper, Snackbar, FormControlLabel, Checkbox, FormHelperText } from "@mui/material";
import MuiLink from "@mui/material/Link";
import NextLink from "next/link";
import type { RegistrationFormData, SubmissionData, OptionCounts, AdditionalPersonData } from "@/lib/types/registration-form";
import { isInputField, getAllFields, getAllInputFields, getAPInputFields, hasAdditionalPeopleFields, getDisabledOptionsForField } from "@/lib/types/registration-form";
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
    isLoggedIn?: boolean;
    publicEmail?: string;
}

function buildInitialValues(formData: RegistrationFormData, publicEmail?: string): SubmissionData {
    const values: SubmissionData = {};
    const inputFields = getAllInputFields(formData.fields);
    for (const field of inputFields) {
        if (field.type === "checkbox") {
            values[field.name] = false;
        } else if (field.type === "pricing_quantity") {
            values[field.name] = 0;
        } else if (field.type === "pricing_multi_select") {
            values[field.name] = "[]";
        } else if (field.type === "email" && publicEmail) {
            values[field.name] = publicEmail;
        } else {
            values[field.name] = "";
        }
    }
    return values;
}

export function DynamicRegistrationForm({ formData, optionCounts, previewMode, isLoggedIn, publicEmail }: DynamicRegistrationFormProps) {
    const [values, setValues] = useState<SubmissionData>(() => buildInitialValues(formData, publicEmail));
    const [additionalPeople, setAdditionalPeople] = useState<AdditionalPersonData[]>([]);
    const { visibleFields } = useConditionalFields(formData, values);
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

    // Auto-select single enabled option for pricing_select, select, and radio fields
    useEffect(() => {
        const inputFields = getAllInputFields(formData.fields);
        const updates: Record<string, string> = {};

        for (const field of inputFields) {
            if (!visibleFields.has(field.id)) continue;

            if (field.type === "pricing_select" && field.pricingId) {
                const def = formData.pricingDefinitions.find(d => d.id === field.pricingId);
                if (!def) continue;
                const disabledOpts = getDisabledOptionsForField(field.id, field.name, formData.capacityLimits, optionCounts);
                const enabledOptions = def.options.filter(o => !disabledOpts.has(o.name));
                if (enabledOptions.length === 1) {
                    updates[field.name] = enabledOptions[0].name;
                }
            } else if (field.type === "select" || field.type === "radio") {
                if (!field.options || field.options.length === 0) continue;
                const disabledOpts = getDisabledOptionsForField(field.id, field.name, formData.capacityLimits, optionCounts);
                const enabledOptions = field.options.filter(o => !disabledOpts.has(o));
                if (enabledOptions.length === 1) {
                    updates[field.name] = enabledOptions[0];
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            setValues(prev => {
                const next = { ...prev };
                let changed = false;
                for (const [name, value] of Object.entries(updates)) {
                    if (prev[name] === "" || prev[name] === undefined) {
                        next[name] = value;
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }
    }, [visibleFields, formData, optionCounts]);

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
            return evaluateAPVisibleFields(formData, merged);
        });
    }, [showAPSection, additionalPeople, values, formData]);

    if (!previewMode && state?.success) {
        return (
            <RegistrationSuccess
                message={state.message}
                variableSymbol={state.variableSymbol}
                totalPrice={state.totalPrice}
                paymentData={state.paymentData}
            />
        );
    }

    return (
        <Paper sx={{ p: { xs: 3, md: 5 } }}>
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
                        const disabledOpts = isInputField(field)
                            ? getDisabledOptionsForField(field.id, field.name, formData.capacityLimits, optionCounts)
                            : undefined;

                        return (
                            <DynamicFormField
                                key={field.id}
                                field={field}
                                value={value}
                                error={isInputField(field) ? getFieldError(field.name) : undefined}
                                onChange={handleChange}
                                pricingDefinitions={formData.pricingDefinitions}
                                priceTiers={formData.priceTiers}
                                disabledOptions={disabledOpts}
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
                        priceTiers={formData.priceTiers ?? []}
                        allInputFields={allInputFields}
                        mainValues={values}
                        additionalPeople={additionalPeople}
                        visibleMainFields={visibleFields}
                        visibleAPFieldsPerPerson={visibleAPFieldsPerPerson}
                    />
                )}

                {!isLoggedIn && !previewMode && (
                    <Box sx={{ mt: 3 }}>
                        <FormControlLabel
                            control={<Checkbox name="gdprConsent" />}
                            label={
                                <>
                                    Souhlasím se{" "}
                                    <MuiLink component={NextLink} href="/gdpr" target="_blank">
                                        zpracováním osobních údajů
                                    </MuiLink>
                                </>
                            }
                        />
                        {state?.errors?.gdprConsent && (
                            <FormHelperText error>
                                {state.errors.gdprConsent[0]}
                            </FormHelperText>
                        )}
                    </Box>
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
                    {state?.message && !state.success && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {state.message}
                        </Alert>
                    )}
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
