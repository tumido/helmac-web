"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
} from "@mui/material";
import { requestPasswordReset } from "@/lib/actions/public/password-reset";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={pending}
            sx={{ mt: 3, mb: 2 }}
        >
            {pending ? (
                <CircularProgress size={24} color="inherit" />
            ) : (
                "Odeslat odkaz"
            )}
        </Button>
    );
}

export function PasswordResetForm() {
    const [state, formAction] = useActionState(requestPasswordReset, null);

    return (
        <Box component="form" action={formAction} sx={{ mt: 1 }}>
            {state?.message && (
                <Alert severity={state.success ? "success" : "error"} sx={{ mb: 2 }}>
                    {state.message}
                </Alert>
            )}

            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                error={!!state?.errors?.email}
                helperText={state?.errors?.email?.[0]}
            />

            <SubmitButton />
        </Box>
    );
}
