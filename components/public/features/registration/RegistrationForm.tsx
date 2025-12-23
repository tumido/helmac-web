"use client";

import { Box, Button, Alert, Paper } from "@mui/material";
import { useRegistrationForm } from "./useRegistrationForm";
import { RegistrationFormFields } from "./RegistrationFormFields";
import { RegistrationSuccess } from "./RegistrationSuccess";

export function RegistrationForm() {
    const {
        formData,
        formAction,
        isPending,
        state,
        handleChange,
        handleSelectChange,
        handleCheckboxChange,
        getFieldError,
    } = useRegistrationForm();

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
                <RegistrationFormFields
                    formData={formData}
                    onChange={handleChange}
                    onSelectChange={handleSelectChange}
                    onCheckboxChange={handleCheckboxChange}
                    getError={getFieldError}
                />

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
                        {isPending ? "Odesilam..." : "Odeslat registraci"}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}
