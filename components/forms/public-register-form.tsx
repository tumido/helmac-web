"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    FormHelperText,
} from "@mui/material";
import NextLink from "next/link";
import MuiLink from "@mui/material/Link";
import { publicRegister } from "@/lib/actions/public/auth";
import { publicRegisterSchema } from "@/lib/validators/public-user";

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
    const [gdprConsent, setGdprConsent] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<
        string,
        string[]
    > | null>(null);

    const handleSubmit = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        const formData = new FormData(event.currentTarget);
        const rawData = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            confirmPassword: formData.get(
                "confirmPassword",
            ) as string,
            gdprConsent,
        };

        const validated =
            publicRegisterSchema.safeParse(rawData);
        if (!validated.success) {
            event.preventDefault();
            setClientErrors(
                validated.error.flatten()
                    .fieldErrors as Record<string, string[]>,
            );
            return;
        }
        setClientErrors(null);
    };

    const errors = clientErrors ?? state?.errors;
    const errorMessage = clientErrors
        ? "Opravte chyby ve formuláři"
        : state?.message && !state.success
          ? state.message
          : undefined;

    return (
        <Box
            component="form"
            action={formAction}
            onSubmit={handleSubmit}
            sx={{ mt: 1 }}
        >
            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
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
                error={!!errors?.email}
                helperText={errors?.email?.[0]}
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
                error={!!errors?.password}
                helperText={
                    errors?.password?.[0] || "Minimálně 8 znaků"
                }
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
                error={!!errors?.confirmPassword}
                helperText={errors?.confirmPassword?.[0]}
            />

            <Box sx={{ mt: 1 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="gdprConsent"
                            checked={gdprConsent}
                            onChange={(e) =>
                                setGdprConsent(
                                    e.target.checked,
                                )
                            }
                        />
                    }
                    label={
                        <>
                            Souhlasím se{" "}
                            <MuiLink
                                component={NextLink}
                                href="/gdpr"
                                target="_blank"
                            >
                                zpracováním osobních údajů
                            </MuiLink>
                        </>
                    }
                />
                {errors?.gdprConsent && (
                    <FormHelperText error>
                        {errors.gdprConsent[0]}
                    </FormHelperText>
                )}
            </Box>

            <SubmitButton />
        </Box>
    );
}
