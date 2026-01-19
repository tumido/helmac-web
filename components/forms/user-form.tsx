"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
    MenuItem,
    Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createUser, updateUser, UserActionState } from "@/lib/actions/users";

interface UserFormProps {
    mode: "create" | "edit";
    userId?: string;
    defaultValues?: {
        email?: string;
        name?: string;
        role?: string;
    };
}

const roles = [
    {
        value: "EDITOR",
        label: "Editor",
        description: "Muze upravovat obsah stranek a novinek",
    },
    {
        value: "ADMIN",
        label: "Admin",
        description: "Muze spravovat rocniky, stranky, novinky a galerie",
    },
    {
        value: "SUPER_ADMIN",
        label: "Super Admin",
        description: "Plny pristup vcetne spravy uzivatelu",
    },
];

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={
                pending ? <CircularProgress size={20} color="inherit" /> : <Save />
            }
        >
            {pending
                ? "Ukladam..."
                : mode === "create"
                  ? "Vytvorit uzivatele"
                  : "Ulozit zmeny"}
        </Button>
    );
}

export function UserForm({ mode, userId, defaultValues }: UserFormProps) {
    const action =
        mode === "create" ? createUser : updateUser.bind(null, userId as string);

    const [state, formAction] = useActionState<UserActionState, FormData>(
        action,
        null
    );

    return (
        <Card>
            <Box component="form" action={formAction}>
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                    }}
                >
                    {state?.error?._form && (
                        <Alert severity="error">{state.error._form[0]}</Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required
                            fullWidth
                            id="name"
                            name="name"
                            label="Jmeno"
                            defaultValue={defaultValues?.name || ""}
                            error={!!state?.error?.name}
                            helperText={state?.error?.name?.[0]}
                        />

                        <TextField
                            required
                            fullWidth
                            id="email"
                            name="email"
                            label="Email"
                            type="email"
                            defaultValue={defaultValues?.email || ""}
                            error={!!state?.error?.email}
                            helperText={state?.error?.email?.[0]}
                        />
                    </Box>

                    <TextField
                        select
                        required
                        fullWidth
                        id="role"
                        name="role"
                        label="Role"
                        defaultValue={defaultValues?.role || "EDITOR"}
                        error={!!state?.error?.role}
                        helperText={state?.error?.role?.[0]}
                    >
                        {roles.map((role) => (
                            <MenuItem key={role.value} value={role.value}>
                                <Box>
                                    <Typography>{role.label}</Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {role.description}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required={mode === "create"}
                            fullWidth
                            id="password"
                            name="password"
                            label={mode === "create" ? "Heslo" : "Nove heslo"}
                            type="password"
                            error={!!state?.error?.password}
                            helperText={
                                state?.error?.password?.[0] ||
                                (mode === "edit"
                                    ? "Ponechte prazdne pro zachovani stavajiciho hesla"
                                    : "Minimalne 8 znaku")
                            }
                        />

                        <TextField
                            required={mode === "create"}
                            fullWidth
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Potvrzeni hesla"
                            type="password"
                            error={!!state?.error?.confirmPassword}
                            helperText={state?.error?.confirmPassword?.[0]}
                        />
                    </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href="/admin/uzivatele">
                        Zrusit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
