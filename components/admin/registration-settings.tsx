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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Warning } from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
import { toggleRegistration, updateRegistrationStartDate } from "@/lib/actions/years";

interface RegistrationSettingsProps {
    yearId: string;
    registrationOpen: boolean;
    registrationStartDate: Date | null;
    submissionCount: number;
    totalPeopleCount: number;
    hasMainEmail: boolean;
    hasBankAccount: boolean;
}

export function RegistrationSettings({
    yearId,
    registrationOpen,
    registrationStartDate,
    submissionCount,
    totalPeopleCount,
    hasMainEmail,
    hasBankAccount,
}: RegistrationSettingsProps) {
    const [isOpen, setIsOpen] = useState(registrationOpen);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [constraintsOpen, setConstraintsOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateValue, setDateValue] = useState<Dayjs | null>(
        registrationStartDate ? dayjs(registrationStartDate) : null
    );
    const [dateSaving, setDateSaving] = useState(false);

    const handleToggleClick = () => {
        const newValue = !isOpen;
        setPendingToggle(newValue);

        // When opening, check constraints first
        if (newValue && (!hasMainEmail || !hasBankAccount)) {
            setConstraintsOpen(true);
            return;
        }

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

    const handleDateChange = async (newValue: Dayjs | null) => {
        setDateValue(newValue);
        const newDateStr = newValue?.format("YYYY-MM-DD") ?? null;
        const currentDbDate = registrationStartDate
            ? new Date(registrationStartDate).toISOString().split("T")[0]
            : null;
        if (newDateStr === currentDbDate) return;

        setDateSaving(true);
        setError(null);
        const result = await updateRegistrationStartDate(yearId, newDateStr);
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

                <DatePicker
                    label="Datum otevření registrace"
                    value={dateValue}
                    onChange={handleDateChange}
                    disabled={dateSaving}
                    format="DD.MM.YYYY"
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            helperText: "Pokud je registrace uzavřena, na veřejných stránkách se zobrazí datum otevření",
                            sx: { mt: 2 },
                        },
                    }}
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

            <Dialog open={constraintsOpen} onClose={() => { setConstraintsOpen(false); setPendingToggle(null); }}>
                <DialogTitle>Nelze otevřít registraci</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Před otevřením registrace je nutné splnit následující podmínky:
                    </DialogContentText>
                    <List>
                        {!hasMainEmail && (
                            <ListItem>
                                <ListItemIcon><Warning color="warning" /></ListItemIcon>
                                <ListItemText primary="Nastavte hlavní emailovou adresu" />
                            </ListItem>
                        )}
                        {!hasBankAccount && (
                            <ListItem>
                                <ListItemIcon><Warning color="warning" /></ListItemIcon>
                                <ListItemText primary="Nastavte bankovní účet" />
                            </ListItem>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setConstraintsOpen(false); setPendingToggle(null); }}>
                        Zavřít
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
