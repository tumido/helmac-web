"use client";

import { useState, useCallback, useActionState } from "react";
import { Box, Button, Alert, Paper } from "@mui/material";
import type { RegistrationFormData, SubmissionData, OptionCounts } from "@/lib/types/registration-form";
import { isInputField, getAllFields, getAllInputFields } from "@/lib/types/registration-form";
import { DynamicFormField } from "./DynamicFormField";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { useConditionalFields } from "./useConditionalFields";
import { submitDynamicRegistration, type RegistrationState } from "@/lib/actions/public/registration";

interface DynamicRegistrationFormProps {
    formData: RegistrationFormData;
    optionCounts?: OptionCounts;
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

export function DynamicRegistrationForm({ formData, optionCounts }: DynamicRegistrationFormProps) {
    const [values, setValues] = useState<SubmissionData>(() => buildInitialValues(formData));
    const { visibleFields } = useConditionalFields(formData, values, optionCounts);

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

    if (state?.success) {
        return <RegistrationSuccess message={state.message} />;
    }

    // Flatten all fields for rendering (preserving order from elements)
    const allFields = getAllFields(formData.fields);
    const allInputFields = getAllInputFields(formData.fields);

    return (
        <Paper sx={{ p: { xs: 3, md: 5 } }}>
            {state?.message && !state.success && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {state.message}
                </Alert>
            )}

            <Box component="form" action={formAction}>
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
                            />
                        );
                    })}
                </Box>

                <Box sx={{ mt: 4, textAlign: "center" }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        size="large"
                        disabled={isPending}
                        sx={{
                            px: 6,
                            py: 1.5,
                            fontSize: "1.1rem",
                        }}
                    >
                        {isPending ? "Odesílám..." : "Odeslat registraci"}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}
