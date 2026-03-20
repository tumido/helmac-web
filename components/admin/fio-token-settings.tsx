"use client";

import { useState, useTransition } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { Save, Delete, Sync } from "@mui/icons-material";
import {
    saveFioToken,
    removeFioToken,
    toggleFioSync,
    triggerManualSync,
} from "@/lib/actions/bank-sync";
import type { MatchResult } from "@/lib/utils/payment-matching";

interface FioTokenSettingsProps {
    yearId: string;
    hasToken: boolean;
    syncEnabled: boolean;
    lastSyncAt: string | null;
}

export function FioTokenSettings({
    yearId,
    hasToken: initialHasToken,
    syncEnabled: initialSyncEnabled,
    lastSyncAt: initialLastSyncAt,
}: FioTokenSettingsProps) {
    const [hasToken, setHasToken] = useState(initialHasToken);
    const [syncEnabled, setSyncEnabled] = useState(initialSyncEnabled);
    const [lastSyncAt, setLastSyncAt] = useState(initialLastSyncAt);
    const [token, setToken] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<MatchResult | null>(null);
    const [isSaving, startSaving] = useTransition();
    const [isRemoving, startRemoving] = useTransition();
    const [isToggling, startToggling] = useTransition();
    const [isSyncing, startSyncing] = useTransition();

    const handleSaveToken = () => {
        setError(null);
        setFieldErrors({});
        setSuccess(null);

        startSaving(async () => {
            const formData = new FormData();
            formData.set("fioToken", token);
            const result = await saveFioToken(yearId, formData);

            if (result && "error" in result && result.error) {
                if (typeof result.error === "string") {
                    setError(result.error);
                } else {
                    setFieldErrors(result.error as Record<string, string[]>);
                }
            } else {
                setHasToken(true);
                setToken("");
                setSuccess("Token byl uložen");
                setTimeout(() => setSuccess(null), 3000);
            }
        });
    };

    const handleRemoveToken = () => {
        setError(null);
        setSuccess(null);

        startRemoving(async () => {
            const result = await removeFioToken(yearId);
            if (result && "error" in result && result.error) {
                setError(typeof result.error === "string" ? result.error : "Chyba");
            } else {
                setHasToken(false);
                setSyncEnabled(false);
                setSuccess("Token byl odebrán");
                setTimeout(() => setSuccess(null), 3000);
            }
        });
    };

    const handleToggleSync = (checked: boolean) => {
        setError(null);
        setSuccess(null);

        startToggling(async () => {
            const result = await toggleFioSync(yearId, checked);
            if (result && "error" in result && result.error) {
                setError(typeof result.error === "string" ? result.error : "Chyba");
            } else {
                setSyncEnabled(checked);
            }
        });
    };

    const handleManualSync = () => {
        setError(null);
        setSuccess(null);
        setSyncResult(null);

        startSyncing(async () => {
            const result = await triggerManualSync(yearId);
            if (result && "error" in result && result.error) {
                setError(typeof result.error === "string" ? result.error : "Chyba");
            } else if (result && "result" in result && result.result) {
                setSyncResult(result.result);
                setLastSyncAt(new Date().toISOString());
                setSuccess("Synchronizace dokončena");
                setTimeout(() => setSuccess(null), 5000);
            }
        });
    };

    return (
        <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Fio Banka — automatické párování plateb
                </Typography>

                {/* Token input */}
                {!hasToken ? (
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Fio API token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            fullWidth
                            size="small"
                            type="password"
                            placeholder="64znakový API token z Fio internetbanking"
                            error={!!fieldErrors.fioToken}
                            helperText={fieldErrors.fioToken?.[0]}
                            sx={{ mb: 1 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSaveToken}
                            disabled={isSaving || !token}
                            size="small"
                        >
                            {isSaving ? "Ukládání..." : "Uložit token"}
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Fio API token je nastaven.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleRemoveToken}
                            disabled={isRemoving}
                            size="small"
                        >
                            {isRemoving ? "Odebírání..." : "Odebrat token"}
                        </Button>
                    </Box>
                )}

                {/* Sync toggle */}
                {hasToken && (
                    <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={syncEnabled}
                                    onChange={(e) => handleToggleSync(e.target.checked)}
                                    disabled={isToggling}
                                />
                            }
                            label="Automatická synchronizace (každých 10 minut)"
                        />
                    </Box>
                )}

                {/* Last sync info */}
                {hasToken && lastSyncAt && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Poslední synchronizace: {new Date(lastSyncAt).toLocaleString("cs-CZ")}
                    </Typography>
                )}

                {/* Manual sync button */}
                {hasToken && (
                    <Button
                        variant="outlined"
                        startIcon={<Sync />}
                        onClick={handleManualSync}
                        disabled={isSyncing}
                        size="small"
                    >
                        {isSyncing ? "Synchronizuji..." : "Synchronizovat nyní"}
                    </Button>
                )}

                {/* Status messages */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Sync result */}
                {syncResult && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Zpracováno: {syncResult.total} transakcí
                        </Typography>
                        {syncResult.matched > 0 && (
                            <Typography variant="body2">Spárováno: {syncResult.matched}</Typography>
                        )}
                        {syncResult.overpayment > 0 && (
                            <Typography variant="body2">Přeplatky: {syncResult.overpayment}</Typography>
                        )}
                        {syncResult.partial > 0 && (
                            <Typography variant="body2">Částečné platby: {syncResult.partial}</Typography>
                        )}
                        {syncResult.unknownVs > 0 && (
                            <Typography variant="body2">Neznámý VS: {syncResult.unknownVs}</Typography>
                        )}
                        {syncResult.alreadyPaid > 0 && (
                            <Typography variant="body2">Již zaplaceno: {syncResult.alreadyPaid}</Typography>
                        )}
                        {syncResult.outgoing > 0 && (
                            <Typography variant="body2">Odchozí: {syncResult.outgoing}</Typography>
                        )}
                        {syncResult.noVs > 0 && (
                            <Typography variant="body2">Bez VS: {syncResult.noVs}</Typography>
                        )}
                        {syncResult.duplicates > 0 && (
                            <Typography variant="body2">Duplikáty: {syncResult.duplicates}</Typography>
                        )}
                        {syncResult.emailsSent > 0 && (
                            <Typography variant="body2">Odesláno emailů: {syncResult.emailsSent}</Typography>
                        )}
                        {syncResult.errors.length > 0 && (
                            <Typography variant="body2" color="error">
                                Chyby: {syncResult.errors.join(", ")}
                            </Typography>
                        )}
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
