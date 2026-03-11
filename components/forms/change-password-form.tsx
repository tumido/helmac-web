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
import { changePassword } from "@/lib/actions/public/profile";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="contained"
            disabled={pending}
            sx={{ mt: 2 }}
        >
            {pending ? (
                <CircularProgress size={24} color="inherit" />
            ) : (
                "Změnit heslo"
            )}
        </Button>
    );
}

export function ChangePasswordForm() {
    const [state, formAction] = useActionState(changePassword, null);

    return (
        <Box component="form" action={formAction}>
            {state?.message && (
                <Alert severity={state.success ? "success" : "error"} sx={{ mb: 2 }}>
                    {state.message}
                </Alert>
            )}

            <TextField
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="Současné heslo"
                type="password"
                autoComplete="current-password"
                error={!!state?.errors?.currentPassword}
                helperText={state?.errors?.currentPassword?.[0]}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Nové heslo"
                type="password"
                autoComplete="new-password"
                error={!!state?.errors?.newPassword}
                helperText={state?.errors?.newPassword?.[0] || "Minimálně 8 znaků"}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="confirmNewPassword"
                label="Potvrzení nového hesla"
                type="password"
                autoComplete="new-password"
                error={!!state?.errors?.confirmNewPassword}
                helperText={state?.errors?.confirmNewPassword?.[0]}
            />

            <SubmitButton />
        </Box>
    );
}
