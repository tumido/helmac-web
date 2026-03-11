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
import { resetPassword } from "@/lib/actions/public/password-reset";

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
                "Nastavit nové heslo"
            )}
        </Button>
    );
}

export function NewPasswordForm({ token }: { token: string }) {
    const [state, formAction] = useActionState(resetPassword, null);

    return (
        <Box component="form" action={formAction} sx={{ mt: 1 }}>
            <input type="hidden" name="token" value={token} />

            {state?.message && !state.success && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {state.message}
                </Alert>
            )}

            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Nové heslo"
                type="password"
                autoComplete="new-password"
                autoFocus
                error={!!state?.errors?.password}
                helperText={state?.errors?.password?.[0] || "Minimálně 8 znaků"}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Potvrzení hesla"
                type="password"
                autoComplete="new-password"
                error={!!state?.errors?.confirmPassword}
                helperText={state?.errors?.confirmPassword?.[0]}
            />

            <SubmitButton />
        </Box>
    );
}
