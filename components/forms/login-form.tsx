"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
} from "@mui/material";
import { login } from "@/lib/actions/auth";

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
                "Prihlasit se"
            )}
        </Button>
    );
}

export function LoginForm() {
    const [state, formAction] = useFormState(login, null);

    return (
        <Box component="form" action={formAction} sx={{ mt: 1 }}>
            {state?.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {state.error}
                </Alert>
            )}

            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Heslo"
                type="password"
                id="password"
                autoComplete="current-password"
            />

            <SubmitButton />
        </Box>
    );
}
