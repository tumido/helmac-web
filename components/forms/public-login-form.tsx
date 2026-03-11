"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Typography,
} from "@mui/material";
import { publicLogin } from "@/lib/actions/public/auth";

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
                "Přihlásit se"
            )}
        </Button>
    );
}

export function PublicLoginForm() {
    const [state, formAction] = useActionState(publicLogin, null);

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
                autoComplete="current-password"
                error={!!state?.errors?.password}
                helperText={state?.errors?.password?.[0]}
            />

            <SubmitButton />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                <Typography
                    component={Link}
                    href="/zapomenute-heslo"
                    variant="body2"
                    sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                    Zapomenuté heslo?
                </Typography>
                <Typography
                    component={Link}
                    href="/vytvorit-ucet"
                    variant="body2"
                    sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                    Vytvořit účet
                </Typography>
            </Box>
        </Box>
    );
}
