"use client";

import { useEffect } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { CheckCircle } from "@mui/icons-material";
import { formatPrice } from "@/lib/utils/pricing";
import { QRCodeSVG } from "qrcode.react";
import type { PaymentData } from "@/lib/actions/public/registration";

interface RegistrationSuccessProps {
    message: string;
    variableSymbol?: string;
    totalPrice?: number;
    paymentData?: PaymentData;
}

export function RegistrationSuccess({ message, variableSymbol, totalPrice, paymentData }: RegistrationSuccessProps) {
    useEffect(() => {
        if (!paymentData) return;
        const trigger = () => {
            navigator.sendBeacon("/api/public/sync-payments");
        };
        window.addEventListener("beforeunload", trigger);
        return () => {
            window.removeEventListener("beforeunload", trigger);
            // Cleanup runs on client-side navigation (Next.js Link clicks);
            // beforeunload only covers full-page unloads.
            trigger();
        };
    }, [paymentData]);
    return (
        <Paper
            sx={{
                p: 6,
                textAlign: "center",
                backgroundColor: "background.paper",
            }}
        >
            <CheckCircle
                sx={{
                    fontSize: 80,
                    color: "success.main",
                    mb: 3,
                }}
            />
            <Typography variant="h4" gutterBottom>
                Registrace úspěšná!
            </Typography>
            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
            >
                {message}
            </Typography>

            {paymentData ? (
                <>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" gutterBottom>
                        Platební údaje
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                        <QRCodeSVG
                            value={paymentData.spaydString}
                            size={200}
                            level="M"
                        />
                    </Box>
                    <Paper
                        variant="outlined"
                        sx={{ p: 3, mb: 3, maxWidth: 400, mx: "auto", textAlign: "left" }}
                    >
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Částka:
                            </Typography>
                            <Typography variant="h5" fontWeight={600}>
                                {formatPrice(paymentData.totalAmount)}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Číslo účtu:
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ fontFamily: "monospace" }}
                            >
                                {paymentData.bankAccount}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Variabilní symbol:
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ fontFamily: "monospace", letterSpacing: 2 }}
                            >
                                {paymentData.variableSymbol}
                            </Typography>
                        </Box>
                    </Paper>
                </>
            ) : (totalPrice != null || variableSymbol) ? (
                <Paper
                    variant="outlined"
                    sx={{ p: 3, mb: 3, maxWidth: 400, mx: "auto", textAlign: "left" }}
                >
                    {totalPrice != null && (
                        <Box sx={{ mb: variableSymbol ? 2 : 0 }}>
                            <Typography variant="body2" color="text.secondary">
                                Celková cena:
                            </Typography>
                            <Typography variant="h5" fontWeight={600}>
                                {formatPrice(totalPrice)}
                            </Typography>
                        </Box>
                    )}
                    {variableSymbol && (
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Variabilní symbol pro platbu:
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={600}
                                sx={{ fontFamily: "monospace", letterSpacing: 2 }}
                            >
                                {variableSymbol}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            ) : null}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Potvrzení o registraci jsme vám zaslali na email. Potvrzení platby může trvat až jeden den.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <LinkButton href="/" variant="contained">
                    Zpět na hlavní stránku
                </LinkButton>
                <LinkButton href="/novinky" variant="outlined">
                    Sledovat novinky
                </LinkButton>
            </Box>
        </Paper>
    );
}
