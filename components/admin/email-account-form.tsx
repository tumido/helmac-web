"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    TextField,
    Typography,
} from "@mui/material";
import { createEmailAccount, updateEmailAccount, type EmailAccountActionState } from "@/lib/actions/email-accounts";

interface EmailAccountFormProps {
    mode: "create" | "edit";
    open: boolean;
    onClose: () => void;
    account?: {
        id: string;
        email: string;
        label: string | null;
        isMain: boolean;
    };
}

export function EmailAccountForm({ mode, open, onClose, account }: EmailAccountFormProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setFieldErrors({});

        const formData = new FormData(e.currentTarget);

        let result: EmailAccountActionState;
        if (mode === "edit" && account) {
            result = await updateEmailAccount(account.id, formData);
        } else {
            result = await createEmailAccount(null, formData);
        }

        setSaving(false);

        if (result?.error) {
            if (typeof result.error === "string") {
                setError(result.error);
            } else {
                setFieldErrors(result.error as Record<string, string[]>);
            }
        } else if (result?.success) {
            onClose();
        }
    };

    const handleClose = () => {
        setError(null);
        setFieldErrors({});
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {mode === "create" ? "Přidat emailový účet" : "Upravit emailový účet"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        {mode === "create" ? (
                            <TextField
                                name="email"
                                label="Email"
                                type="email"
                                required
                                fullWidth
                                placeholder="info@seznam.cz"
                                error={!!fieldErrors.email}
                                helperText={fieldErrors.email?.[0] ?? "Musí být @seznam.cz nebo @email.cz"}
                            />
                        ) : (
                            <Typography variant="body1" color="text.secondary">
                                {account?.email}
                            </Typography>
                        )}

                        <TextField
                            name="password"
                            label={mode === "create" ? "Heslo (SMTP)" : "Nové heslo (SMTP)"}
                            type="password"
                            required={mode === "create"}
                            fullWidth
                            error={!!fieldErrors.password}
                            helperText={
                                fieldErrors.password?.[0] ??
                                (mode === "edit" ? "Vyplňte pouze pokud chcete změnit heslo" : "Heslo k SMTP serveru (Seznam.cz)")
                            }
                        />

                        <TextField
                            name="label"
                            label="Název (volitelný)"
                            fullWidth
                            defaultValue={account?.label ?? ""}
                            placeholder="např. Hlavní, Registrace, Info"
                            error={!!fieldErrors.label}
                            helperText={fieldErrors.label?.[0]}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="isMain"
                                    value="true"
                                    defaultChecked={account?.isMain ?? false}
                                />
                            }
                            label="Hlavní účet (výchozí odesílatel)"
                        />

                        <Box sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                SMTP Server: smtp.seznam.cz | Port: 465 | Šifrování: SSL/TLS
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>
                        Zrušit
                    </Button>
                    <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? "Ukládání..." : (mode === "create" ? "Přidat" : "Uložit")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
