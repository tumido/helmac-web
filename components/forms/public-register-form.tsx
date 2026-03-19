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
import { publicRegister } from "@/lib/actions/public/auth";

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
                "Vytvořit účet"
            )}
        </Button>
    );
}

export function PublicRegisterForm() {
    const [state, formAction] = useActionState(publicRegister, null);

    return (
        <Box component="form" action={formAction} sx={{ mt: 1 }}>
            {state?.message && !state.success && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
                defaultValue={state?.email ?? ""}
                error={!!state?.errors?.email}
                helperText={state?.errors?.email?.[0]}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Heslo"
                type="password"
                id="password"
                autoComplete="new-password"
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
                id="confirmPassword"
                autoComplete="new-password"
                error={!!state?.errors?.confirmPassword}
                helperText={state?.errors?.confirmPassword?.[0]}
            />

            <SubmitButton />
        </Box>
    );
}
