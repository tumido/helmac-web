"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Paper,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { changePassword } from "@/lib/actions/public/profile";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={pending}
            sx={{
                px: 6,
                py: 1.5,
                fontSize: "1.1rem",
                boxShadow: (theme) =>
                    `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                "&:hover": {
                    boxShadow: (theme) =>
                        `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
            }}
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
                <Alert
                    severity={state.success ? "success" : "error"}
                    sx={{ mb: 3 }}
                >
                    {state.message}
                </Alert>
            )}

            <Paper
                variant="outlined"
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                }}
            >
                <TextField
                    id="currentPassword"
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
                    id="newPassword"
                    required
                    fullWidth
                    name="newPassword"
                    label="Nové heslo"
                    type="password"
                    autoComplete="new-password"
                    error={!!state?.errors?.newPassword}
                    helperText={
                        state?.errors?.newPassword?.[0] || "Minimálně 8 znaků"
                    }
                />

                <TextField
                    id="confirmNewPassword"
                    required
                    fullWidth
                    name="confirmNewPassword"
                    label="Potvrzení nového hesla"
                    type="password"
                    autoComplete="new-password"
                    error={!!state?.errors?.confirmNewPassword}
                    helperText={state?.errors?.confirmNewPassword?.[0]}
                />
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    Po změně hesla zůstanete přihlášeni.
                </Typography>
                <SubmitButton />
            </Paper>
        </Box>
    );
}
