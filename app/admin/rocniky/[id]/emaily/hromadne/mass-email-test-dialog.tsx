"use client";

import { useState, useTransition } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import { sendTestEmail } from "@/lib/actions/email-test";

interface MassEmailTestDialogProps {
    open: boolean;
    onClose: () => void;
    subject: string;
    body: string;
    emailAccountId: string | null;
}

export function MassEmailTestDialog({
    open,
    onClose,
    subject,
    body,
    emailAccountId,
}: MassEmailTestDialogProps) {
    const [recipient, setRecipient] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [wasOpen, setWasOpen] = useState(open);

    if (wasOpen !== open) {
        setWasOpen(open);
        if (open) {
            setRecipient("");
            setError(null);
            setSuccess(false);
        }
    }

    const handleClose = () => {
        if (!isPending) {
            onClose();
        }
    };

    const handleSubmit = () => {
        setError(null);
        setSuccess(false);

        if (!recipient.trim()) {
            setError("Zadejte emailovou adresu příjemce");
            return;
        }

        startTransition(async () => {
            const result = await sendTestEmail({
                subject,
                body,
                emailAccountId,
                recipient: recipient.trim(),
                placeholderValues: {},
            });

            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Testovací odeslání emailu</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        mt: 1,
                    }}
                >
                    <TextField
                        label="Příjemce"
                        type="email"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        fullWidth
                        required
                        autoFocus
                        disabled={isPending}
                        placeholder="adresa@example.com"
                    />

                    {error && <Alert severity="error">{error}</Alert>}
                    {success && (
                        <Alert severity="success">
                            Testovací email byl odeslán
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isPending}>
                    Zrušit
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isPending || !recipient.trim() || success}
                >
                    {isPending ? "Odesílání..." : "Odeslat testovací email"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
