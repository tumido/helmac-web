"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography,
    Paper,
} from "@mui/material";
import { QrCode2 } from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import { formatPrice } from "@/lib/utils/pricing";

interface PaymentQrDialogProps {
    spaydString: string;
    amount: number;
    bankAccount: string;
    variableSymbol: string;
}

export function PaymentQrDialog({ spaydString, amount, bankAccount, variableSymbol }: PaymentQrDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <IconButton size="small" onClick={() => setOpen(true)} title="Zobrazit QR kód pro platbu">
                <QrCode2 />
            </IconButton>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>QR platba</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 3, mt: 1 }}>
                        <QRCodeSVG
                            value={spaydString}
                            size={200}
                            level="M"
                        />
                    </Box>
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, textAlign: "left" }}
                    >
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Částka:
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                                {formatPrice(amount)}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Číslo účtu:
                            </Typography>
                            <Typography
                                variant="body1"
                                fontWeight={600}
                                sx={{ fontFamily: "monospace" }}
                            >
                                {bankAccount}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Variabilní symbol:
                            </Typography>
                            <Typography
                                variant="body1"
                                fontWeight={600}
                                sx={{ fontFamily: "monospace", letterSpacing: 2 }}
                            >
                                {variableSymbol}
                            </Typography>
                        </Box>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Zavřít</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
