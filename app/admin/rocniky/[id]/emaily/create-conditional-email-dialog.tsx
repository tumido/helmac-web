"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { createConditionalEmail } from "@/lib/actions/conditional-emails";

interface FieldOption {
    id: string;
    name: string;
    label: string;
    options: string[];
}

interface CreateConditionalEmailDialogProps {
    yearId: string;
    availableFields: FieldOption[];
}

export function CreateConditionalEmailDialog({
    yearId,
    availableFields,
}: CreateConditionalEmailDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [selectedFieldId, setSelectedFieldId] = useState("");
    const [selectedValue, setSelectedValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const selectedField = availableFields.find((f) => f.id === selectedFieldId);

    const handleOpen = () => {
        setOpen(true);
        setName("");
        setSelectedFieldId("");
        setSelectedValue("");
        setError(null);
    };

    const handleClose = () => {
        if (!isPending) {
            setOpen(false);
        }
    };

    const handleSubmit = () => {
        if (!name.trim() || !selectedFieldId || !selectedValue) {
            setError("Vyplňte všechna pole");
            return;
        }

        const field = availableFields.find((f) => f.id === selectedFieldId);
        if (!field) return;

        setError(null);
        startTransition(async () => {
            const result = await createConditionalEmail(yearId, {
                name: name.trim(),
                conditionFieldId: selectedFieldId,
                conditionFieldName: field.name,
                conditionValue: selectedValue,
            });

            if (result && "error" in result && result.error) {
                setError(typeof result.error === "string" ? result.error : "Nepodařilo se vytvořit email");
                return;
            }

            if (result && "id" in result && result.id) {
                setOpen(false);
                router.push(`/admin/rocniky/${yearId}/emaily/podmineny/${result.id}`);
                router.refresh();
            }
        });
    };

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleOpen}
                sx={{ mt: 3 }}
            >
                Vytvořit podmíněný email
            </Button>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Nový podmíněný email</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <TextField
                            label="Název emailu"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            placeholder="např. Email pro vegetariány"
                            disabled={isPending}
                        />

                        <FormControl fullWidth disabled={isPending}>
                            <InputLabel>Pole podmínky</InputLabel>
                            <Select
                                value={selectedFieldId}
                                onChange={(e) => {
                                    setSelectedFieldId(e.target.value);
                                    setSelectedValue("");
                                }}
                                label="Pole podmínky"
                            >
                                {availableFields.map((field) => (
                                    <MenuItem key={field.id} value={field.id}>
                                        {field.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedField && (
                            <FormControl fullWidth disabled={isPending}>
                                <InputLabel>Hodnota</InputLabel>
                                <Select
                                    value={selectedValue}
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                    label="Hodnota"
                                >
                                    {selectedField.options.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {error && (
                            <Alert severity="error">{error}</Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isPending}>
                        Zrušit
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isPending || !name.trim() || !selectedFieldId || !selectedValue}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
