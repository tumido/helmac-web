"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from "@mui/material";
import { Email, CheckCircle, Cancel } from "@mui/icons-material";
import { resendConfirmationEmail } from "@/lib/actions/registration-submissions";
import { formatDateTime } from "@/lib/utils/date";

interface ResendEmailButtonProps {
    submissionId: string;
    emailSent: boolean;
    emailSentAt: Date | null;
}

export function ResendEmailButton({ submissionId, emailSent, emailSentAt }: ResendEmailButtonProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleResend = async () => {
        setConfirmOpen(false);
        setSending(true);
        setError(null);
        setSuccess(false);

        const result = await resendConfirmationEmail(submissionId);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        }

        setSending(false);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {emailSent ? (
                    <CheckCircle fontSize="small" color="success" />
                ) : (
                    <Cancel fontSize="small" color="disabled" />
                )}
                <Typography variant="body2">
                    {emailSent
                        ? `Email odeslán ${emailSentAt ? formatDateTime(emailSentAt) : ""}`
                        : "Email nebyl odeslán"}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 1 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 1 }}>
                    Email byl úspěšně odeslán
                </Alert>
            )}

            <Button
                variant="outlined"
                size="small"
                startIcon={<Email />}
                onClick={() => setConfirmOpen(true)}
                disabled={sending}
            >
                {sending ? "Odesílání..." : "Znovu odeslat email"}
            </Button>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Znovu odeslat potvrzovací email?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Potvrzovací email bude znovu odeslán na emailovou adresu z registrace.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Zrušit</Button>
                    <Button onClick={handleResend} variant="contained">
                        Odeslat
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
