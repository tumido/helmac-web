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

type ConditionOperator = "equals" | "is_set" | "is_not_set";

interface FieldOption {
    id: string;
    name: string;
    label: string;
    type: string;
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
    const [operator, setOperator] = useState<ConditionOperator>("equals");
    const [selectedValue, setSelectedValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const selectedField = availableFields.find((f) => f.id === selectedFieldId);
    const valueRequired = operator === "equals";

    const handleOpen = () => {
        setOpen(true);
        setName("");
        setSelectedFieldId("");
        setOperator("equals");
        setSelectedValue("");
        setError(null);
    };

    const handleClose = () => {
        if (!isPending) {
            setOpen(false);
        }
    };

    const handleSubmit = () => {
        if (!name.trim() || !selectedFieldId || (valueRequired && !selectedValue)) {
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
                conditionOperator: operator,
                conditionValue: valueRequired ? selectedValue : undefined,
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

    const isSubmitDisabled =
        isPending ||
        !name.trim() ||
        !selectedFieldId ||
        (valueRequired && !selectedValue);

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
                                <InputLabel>Operátor</InputLabel>
                                <Select
                                    value={operator}
                                    onChange={(e) => {
                                        setOperator(e.target.value as ConditionOperator);
                                        setSelectedValue("");
                                    }}
                                    label="Operátor"
                                >
                                    <MenuItem value="equals">Konkrétní hodnota</MenuItem>
                                    <MenuItem value="is_set">Cokoli vybráno</MenuItem>
                                    <MenuItem value="is_not_set">Nic nevybráno</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {selectedField && operator === "equals" && (
                            <FormControl fullWidth disabled={isPending}>
                                <InputLabel>Hodnota</InputLabel>
                                <Select
                                    value={selectedValue}
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                    label="Hodnota"
                                >
                                    {selectedField.type === "checkbox" ? (
                                        [
                                            <MenuItem key="true" value="true">Zaškrtnuto</MenuItem>,
                                            <MenuItem key="false" value="false">Nezaškrtnuto</MenuItem>,
                                        ]
                                    ) : (
                                        selectedField.options.map((opt) => (
                                            <MenuItem key={opt} value={opt}>
                                                {opt}
                                            </MenuItem>
                                        ))
                                    )}
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
                        disabled={isSubmitDisabled}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
