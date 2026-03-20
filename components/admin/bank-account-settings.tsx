"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    TextField,
    Typography,
} from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import { updateGlobalBankAccount } from "@/lib/actions/bank-account";

interface BankAccountSettingsProps {
    bankAccountPrefix: string | null;
    bankAccountNumber: string | null;
    bankAccountBankCode: string | null;
}

export function BankAccountSettings({
    bankAccountPrefix,
    bankAccountNumber,
    bankAccountBankCode,
}: BankAccountSettingsProps) {
    const [bankPrefix, setBankPrefix] = useState(bankAccountPrefix ?? "");
    const [bankNumber, setBankNumber] = useState(bankAccountNumber ?? "");
    const [bankCode, setBankCode] = useState(bankAccountBankCode ?? "");
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
        setBankEditing(false);
        setError(null);
    };

    return (
        <Box sx={{ maxWidth: 500 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2">
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
            {!bankEditing && hasSavedBank ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Pokud je vyplněno, po registraci se zobrazí QR kód pro platbu
            </Typography>
        </Box>
    );
}
