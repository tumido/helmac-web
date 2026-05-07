"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { Check } from "@mui/icons-material";
import { formatPrice } from "@/lib/utils/pricing";
import { QRCodeSVG } from "qrcode.react";
import { DecorativeDivider } from "@/components/public/ui";
import type { PaymentData } from "@/lib/actions/public/registration";

interface RegistrationSuccessProps {
    message: string;
    variableSymbol?: string;
    totalPrice?: number;
    paymentData?: PaymentData;
}

export function RegistrationSuccess({
    message,
    variableSymbol,
    totalPrice,
    paymentData,
}: RegistrationSuccessProps) {
    const detailsRef = useRef<HTMLDivElement>(null);
    const [detailsHeight, setDetailsHeight] = useState<number>(0);

    useEffect(() => {
        if (!detailsRef.current) return;
        const measure = () => {
            setDetailsHeight(
                detailsRef.current?.offsetHeight ?? 0
            );
        };
        measure();
        window.addEventListener("resize", measure);
        return () =>
            window.removeEventListener("resize", measure);
    }, []);

    useEffect(() => {
        if (!paymentData) return;
        const trigger = () => {
            navigator.sendBeacon("/api/public/sync-payments");
        };
        window.addEventListener("beforeunload", trigger);
        return () => {
            window.removeEventListener("beforeunload", trigger);
            trigger();
        };
    }, [paymentData]);

    const hasPaymentSection =
        paymentData || totalPrice != null || variableSymbol;

    return (
        <Box>
            <Box
                sx={{
                    display: { md: "flex" },
                    gap: 6,
                    alignItems: "center",
                    py: { xs: 4, md: 6 },
                }}
            >
                <Box
                    sx={{
                        flex: "1 1 0",
                        textAlign: "center",
                    }}
                >
                    <Check
                        sx={{
                            fontSize: 64,
                            color: "primary.main",
                            mb: 2,
                        }}
                    />
                    <Typography
                        variant="h3"
                        sx={{
                            color: "primary.main",
                            mb: 1,
                        }}
                    >
                        Registrace úspěšná!
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        {message}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Potvrzení o registraci jsme vám zaslali
                        na email. Potvrzení platby může trvat až
                        jeden den.
                    </Typography>
                </Box>

                {hasPaymentSection && (
                <Box
                    sx={{
                        flex: "1 1 0",
                        mt: { xs: 4, md: 0 },
                    }}
                >
                    {paymentData ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                borderRadius: 2,
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    color: "primary.main",
                                    mb: 1,
                                    textAlign: "center",
                                }}
                            >
                                Platební údaje
                            </Typography>
                            <DecorativeDivider
                                variant="ornate"
                                my={2}
                            />
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: {
                                        xs: "column",
                                        sm: "row",
                                    },
                                    gap: 3,
                                    alignItems: "center",
                                }}
                            >
                            <Box
                                sx={{
                                    backgroundColor: "white",
                                    borderRadius: 2,
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    p: 2,
                                    width: detailsHeight > 0 ? detailsHeight : "auto",
                                    height: detailsHeight > 0 ? detailsHeight : "auto",
                                }}
                            >
                                <QRCodeSVG
                                    value={
                                        paymentData.spaydString
                                    }
                                    size={detailsHeight > 40 ? detailsHeight - 40 : 140}
                                    level="M"
                                />
                            </Box>
                            <Box
                                ref={detailsRef}
                                sx={{
                                    textAlign: "left",
                                    flex: 1,
                                }}
                            >
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Částka:
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={700}
                                        sx={{
                                            color: "primary.main",
                                        }}
                                    >
                                        {formatPrice(
                                            paymentData.totalAmount
                                        )}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Číslo účtu:
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        sx={{
                                            fontFamily:
                                                "monospace",
                                        }}
                                    >
                                        {paymentData.bankAccount}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Variabilní symbol:
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                        sx={{
                                            fontFamily:
                                                "monospace",
                                            letterSpacing: 2,
                                        }}
                                    >
                                        {
                                            paymentData.variableSymbol
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                textAlign: "left",
                                borderRadius: 2,
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    color: "primary.main",
                                    mb: 1,
                                    textAlign: "center",
                                }}
                            >
                                Platební údaje
                            </Typography>
                            <DecorativeDivider
                                variant="ornate"
                                my={2}
                            />
                            {totalPrice != null && (
                                <Box
                                    sx={{
                                        mb: variableSymbol
                                            ? 2
                                            : 0,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Celková cena:
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={700}
                                        sx={{
                                            color: "primary.main",
                                        }}
                                    >
                                        {formatPrice(
                                            totalPrice
                                        )}
                                    </Typography>
                                </Box>
                            )}
                            {variableSymbol && (
                                <>
                                    {totalPrice != null && (
                                        <Divider
                                            sx={{ my: 1.5 }}
                                        />
                                    )}
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Variabilní symbol
                                            pro platbu:
                                        </Typography>
                                        <Typography
                                            variant="h5"
                                            fontWeight={600}
                                            sx={{
                                                fontFamily:
                                                    "monospace",
                                                letterSpacing: 2,
                                            }}
                                        >
                                            {variableSymbol}
                                        </Typography>
                                    </Box>
                                </>
                            )}
                        </Paper>
                    )}
                </Box>
            )}
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    mt: 5,
                }}
            >
                <LinkButton href="/" variant="contained">
                    Zpět na hlavní stránku
                </LinkButton>
                <LinkButton href="/novinky" variant="outlined">
                    Sledovat novinky
                </LinkButton>
            </Box>
        </Box>
    );
}
