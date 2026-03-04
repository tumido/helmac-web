"use client";

import { useState, useCallback, useActionState } from "react";
import { Box, Button, Alert, Paper } from "@mui/material";
import type { FormField, SubmissionData } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { DynamicFormField } from "./DynamicFormField";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { useConditionalFields } from "./useConditionalFields";
import { submitDynamicRegistration, type RegistrationState } from "@/lib/actions/public/registration";

interface DynamicRegistrationFormProps {
    fields: FormField[];
}

function buildInitialValues(fields: FormField[]): SubmissionData {
    const values: SubmissionData = {};
    for (const field of fields) {
        if (!isInputField(field)) continue;
        if (field.type === "checkbox") {
            values[field.name] = false;
        } else {
            values[field.name] = "";
        }
    }
    return values;
}

export function DynamicRegistrationForm({ fields }: DynamicRegistrationFormProps) {
    const [values, setValues] = useState<SubmissionData>(() => buildInitialValues(fields));
    const visibleFields = useConditionalFields(fields, values);

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

    return (
        <Paper sx={{ p: { xs: 3, md: 5 } }}>
            {state?.message && !state.success && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {state.message}
                </Alert>
            )}

            <Box component="form" action={formAction}>
                {/* Include all values as hidden inputs for FormData */}
                {fields.filter(isInputField).map((field) => {
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
                    // Select/radio/other text fields have name on the visible input
                    return null;
                })}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    {fields.map((field) => {
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
