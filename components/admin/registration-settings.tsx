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
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { toggleRegistration, updateRegistrationStartDate } from "@/lib/actions/years";

interface RegistrationSettingsProps {
    yearId: string;
    registrationOpen: boolean;
    registrationStartDate: Date | null;
    submissionCount: number;
    totalPeopleCount: number;
}

export function RegistrationSettings({
    yearId,
    registrationOpen,
    registrationStartDate,
    submissionCount,
    totalPeopleCount,
}: RegistrationSettingsProps) {
    const [isOpen, setIsOpen] = useState(registrationOpen);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateValue, setDateValue] = useState(
        registrationStartDate
            ? new Date(registrationStartDate).toISOString().split("T")[0]
            : ""
    );
    const [dateSaving, setDateSaving] = useState(false);

    const handleToggleClick = () => {
        setPendingToggle(!isOpen);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (pendingToggle === null) return;
        setConfirmOpen(false);
        setLoading(true);
        setError(null);

        const result = await toggleRegistration(yearId, pendingToggle);
        if (result.error) {
            setError(typeof result.error === "string" ? result.error : "Chyba");
        } else {
            setIsOpen(pendingToggle);
        }
        setLoading(false);
        setPendingToggle(null);
    };

    const handleCancel = () => {
        setConfirmOpen(false);
        setPendingToggle(null);
    };

    const handleDateBlur = async () => {
        const currentDbDate = registrationStartDate
            ? new Date(registrationStartDate).toISOString().split("T")[0]
            : "";
        if (dateValue === currentDbDate) return;

        setDateSaving(true);
        setError(null);
        const result = await updateRegistrationStartDate(yearId, dateValue || null);
        if (result.error) {
            setError(typeof result.error === "string" ? result.error : "Chyba");
        }
        setDateSaving(false);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ maxWidth: 500 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isOpen}
                            onChange={handleToggleClick}
                            disabled={loading}
                            color="success"
                        />
                    }
                    label={
                        <Typography fontWeight={600}>
                            {isOpen ? "Registrace otevřena" : "Registrace uzavřena"}
                        </Typography>
                    }
                />

                <TextField
                    type="date"
                    label="Datum otevření registrace"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    onBlur={handleDateBlur}
                    disabled={dateSaving}
                    helperText="Pokud je registrace uzavřena, na veřejných stránkách se zobrazí datum otevření"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    sx={{ mt: 2 }}
                />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="body1">
                    Registrací: <strong>{submissionCount}</strong>
                </Typography>
                <Typography variant="body1">
                    Registrovaných osob: <strong>{totalPeopleCount}</strong>
                </Typography>
            </Box>

            <Dialog open={confirmOpen} onClose={handleCancel}>
                <DialogTitle>
                    {pendingToggle ? "Otevřít registraci?" : "Uzavřít registraci?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {pendingToggle
                            ? "Registrace bude otevřena a návštěvníci se budou moci registrovat na veřejných stránkách."
                            : "Registrace bude uzavřena a registrační formulář nebude dostupný na veřejných stránkách."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>Zrušit</Button>
                    <Button onClick={handleConfirm} variant="contained" autoFocus>
                        Potvrdit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
