"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
} from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import { updateGlobalBankAccount } from "@/lib/actions/bank-account";

interface BankAccountSettingsProps {
    bankAccountPrefix: string | null;
    bankAccountNumber: string | null;
    bankAccountBankCode: string | null;
    bankSwift: string | null;
}

export function BankAccountSettings({
    bankAccountPrefix,
    bankAccountNumber,
    bankAccountBankCode,
    bankSwift,
}: BankAccountSettingsProps) {
    const [bankPrefix, setBankPrefix] = useState(bankAccountPrefix ?? "");
    const [bankNumber, setBankNumber] = useState(bankAccountNumber ?? "");
    const [bankCode, setBankCode] = useState(bankAccountBankCode ?? "");
    const [swift, setSwift] = useState(bankSwift ?? "");
    const [bankSaving, setBankSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasSavedBank = Boolean(bankAccountNumber);
    const [bankEditing, setBankEditing] = useState(!hasSavedBank);

    const handleBankSave = async () => {
        setBankSaving(true);
        setError(null);
        const fd = new FormData();
        fd.set("bankAccountPrefix", bankPrefix);
        fd.set("bankAccountNumber", bankNumber);
        fd.set("bankAccountBankCode", bankCode);
        fd.set("bankSwift", swift);
        const result = await updateGlobalBankAccount(fd);
        if (result.error) {
            setError(typeof result.error === "string" ? result.error : Object.values(result.error).flat().join(", "));
        } else {
            setBankEditing(false);
        }
        setBankSaving(false);
    };

    const handleBankCancel = () => {
        setBankPrefix(bankAccountPrefix ?? "");
        setBankNumber(bankAccountNumber ?? "");
        setBankCode(bankAccountBankCode ?? "");
        setSwift(bankSwift ?? "");
        setBankEditing(false);
        setError(null);
    };

    return (
        <Card variant="outlined">
            <CardContent>
                {/* Header row with title + edit/cancel/save buttons */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6">
                        Bankovní účet pro platbu
                    </Typography>
                    {!bankEditing && hasSavedBank && (
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => setBankEditing(true)}
                            size="small"
                        >
                            Upravit
                        </Button>
                    )}
                    {bankEditing && hasSavedBank && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleBankCancel}
                                disabled={bankSaving}
                                size="small"
                            >
                                Zrušit
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleBankSave}
                                disabled={bankSaving}
                                size="small"
                            >
                                {bankSaving ? "Ukládám..." : "Uložit"}
                            </Button>
                        </Box>
                    )}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!bankEditing && hasSavedBank ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            backgroundColor: "action.hover",
                        }}
                    >
                        <Typography variant="body2">
                            {bankPrefix && <>{bankPrefix}-</>}
                            <Typography component="span" variant="body2" fontWeight={600}>
                                {bankNumber}
                            </Typography>
                            /{bankCode}
                        </Typography>
                        {swift && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                                SWIFT: {swift}
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            <TextField
                                label="Předčíslí"
                                value={bankPrefix}
                                onChange={(e) => setBankPrefix(e.target.value)}
                                disabled={bankSaving}
                                size="small"
                                sx={{ width: 100 }}
                                inputProps={{ maxLength: 6 }}
                            />
                            <Typography>-</Typography>
                            <TextField
                                label="Číslo účtu"
                                value={bankNumber}
                                onChange={(e) => setBankNumber(e.target.value)}
                                disabled={bankSaving}
                                size="small"
                                sx={{ flex: 1 }}
                                inputProps={{ maxLength: 10 }}
                            />
                            <Typography>/</Typography>
                            <TextField
                                label="Kód banky"
                                value={bankCode}
                                onChange={(e) => setBankCode(e.target.value)}
                                disabled={bankSaving}
                                size="small"
                                sx={{ width: 100 }}
                                inputProps={{ maxLength: 4 }}
                            />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                label="SWIFT / BIC"
                                value={swift}
                                onChange={(e) => setSwift(e.target.value)}
                                disabled={bankSaving}
                                size="small"
                                fullWidth
                                inputProps={{ maxLength: 11, style: { textTransform: "uppercase", fontFamily: "monospace" } }}
                                placeholder="např. GIBACZPX"
                                helperText="SWIFT/BIC kód banky pro zahraniční platby (8 nebo 11 znaků, volitelné)"
                            />
                        </Box>
                        {!hasSavedBank && (
                            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    size="small"
                                    onClick={handleBankSave}
                                    disabled={bankSaving}
                                >
                                    {bankSaving ? "Ukládám..." : "Uložit"}
                                </Button>
                            </Box>
                        )}
                    </>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Pokud je vyplněno, po registraci se zobrazí QR kód pro platbu
                </Typography>
            </CardContent>
        </Card>
    );
}
