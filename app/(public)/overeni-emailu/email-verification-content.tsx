"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, Button, Alert, CircularProgress } from "@mui/material";
import { CheckCircleOutline, ErrorOutline, MailOutline } from "@mui/icons-material";
import { verifyEmail } from "@/lib/actions/public/verify-email";
import { resendVerification } from "@/lib/actions/public/auth";

interface EmailVerificationContentProps {
    email?: string;
}

export function EmailVerificationContent({ email }: EmailVerificationContentProps) {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const pending = searchParams.get("pending");

    const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">(
        token ? "loading" : pending ? "pending" : "error",
    );
    const [message, setMessage] = useState("");
    const [resendPending, startResendTransition] = useTransition();
    const [resendMessage, setResendMessage] = useState("");

    useEffect(() => {
        if (!token) return;

        verifyEmail(token).then((result) => {
            setStatus(result.success ? "success" : "error");
            setMessage(result.message);
        });
    }, [token]);

    useEffect(() => {
        if (pending) {
            window.history.replaceState(null, "", "/overeni-emailu");
        }
    }, [pending]);

    const handleResend = () => {
        if (!email) return;
        startResendTransition(async () => {
            const result = await resendVerification(email);
            setResendMessage(result.message);
        });
    };

    if (status === "loading") {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography>Ověřuji email...</Typography>
            </Box>
        );
    }

    if (status === "success") {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <CheckCircleOutline sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {message || "Email byl úspěšně ověřen"}
                </Typography>
                <Button
                    variant="contained"
                    href="/ucet"
                    sx={{ mt: 2 }}
                >
                    Přejít do účtu
                </Button>
            </Box>
        );
    }

    if (status === "pending") {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <MailOutline sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    Zkontrolujte svůj email
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Na váš email jsme odeslali ověřovací odkaz. Klikněte na něj pro aktivaci účtu.
                </Typography>

                {resendMessage && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {resendMessage}
                    </Alert>
                )}

                <Button
                    variant="outlined"
                    onClick={handleResend}
                    disabled={resendPending}
                >
                    {resendPending ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : null}
                    Odeslat znovu
                </Button>
            </Box>
        );
    }

    // Error state
    return (
        <Box sx={{ textAlign: "center", py: 4 }}>
            <ErrorOutline sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                {message || "Ověření se nezdařilo"}
            </Typography>
            <Button
                variant="outlined"
                href="/prihlaseni"
                sx={{ mt: 2 }}
            >
                Přihlásit se
            </Button>
        </Box>
    );
}
