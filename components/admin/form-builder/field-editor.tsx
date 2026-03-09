"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Box,
    Typography,
    IconButton,
    Chip,
    Tooltip,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import type { FormField, FormCondition, InputField, HeadingField, DescriptionField } from "@/lib/types/registration-form";
import { isInputField, FIELD_TYPE_META } from "@/lib/types/registration-form";
import { getConditionsUsingOptionValue } from "@/lib/utils/condition-validation";

interface FieldEditorProps {
    open: boolean;
    field: FormField | null;
    onClose: () => void;
    onSave: (field: FormField) => void;
    conditions?: FormCondition[];
}

export function FieldEditor({ open, field, onClose, onSave, conditions }: FieldEditorProps) {
    if (!field) return null;

    return (
        <FieldEditorInner
            key={field.id}
            open={open}
            field={field}
            onClose={onClose}
            onSave={onSave}
            conditions={conditions}
        />
    );
}

function FieldEditorInner({ open, field, onClose, onSave, conditions }: Omit<FieldEditorProps, "field"> & { field: FormField }) {
    const [editData, setEditData] = useState<FormField>(() => structuredClone(field));

    const isInput = isInputField(editData);
    const needsOptions = isInput && (editData.type === "select" || editData.type === "radio");

    const handleSave = () => {
        if (!editData) return;
        onSave(editData);
    };

    const updateInput = (updates: Partial<InputField>) => {
        setEditData((prev) => (prev ? { ...prev, ...updates } as FormField : prev));
    };

    const updateLayout = (updates: { text?: string }) => {
        setEditData((prev) => (prev ? { ...prev, ...updates } as FormField : prev));
    };

    const inputData = editData as InputField;
    const layoutData = editData as HeadingField | DescriptionField;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Upravit pole — {FIELD_TYPE_META[editData.type].label}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                    {isInput ? (
                        <>
                            <TextField
                                label="Popisek (label)"
                                value={inputData.label}
                                onChange={(e) => updateInput({ label: e.target.value })}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Název pole (name)"
                                value={inputData.name}
                                onChange={(e) => updateInput({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                                fullWidth
                                required
                                helperText="Unikátní identifikátor pole (pouze a-z, 0-9, _)"
                            />
                            <TextField
                                label="Placeholder"
                                value={inputData.placeholder || ""}
                                onChange={(e) => updateInput({ placeholder: e.target.value || undefined })}
                                fullWidth
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={inputData.required}
                                        onChange={(e) => updateInput({ required: e.target.checked })}
                                    />
                                }
                                label="Povinné pole"
                            />

                            {needsOptions && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Možnosti
                                    </Typography>
                                    {(inputData.options || []).map((opt, idx) => {
                                        const optionUsedInCondition = opt && conditions
                                            ? getConditionsUsingOptionValue(field.id, opt, conditions).length > 0
                                            : false;
                                        return (
                                            <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                                                <TextField
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOptions = [...(inputData.options || [])];
                                                        newOptions[idx] = e.target.value;
                                                        updateInput({ options: newOptions });
                                                    }}
                                                    size="small"
                                                    fullWidth
                                                    placeholder={`Možnost ${idx + 1}`}
                                                />
                                                {optionUsedInCondition && (
                                                    <Chip
                                                        label="Podmínka"
                                                        size="small"
                                                        variant="outlined"
                                                        color="info"
                                                        sx={{ fontSize: "0.7rem", height: 20, flexShrink: 0 }}
                                                    />
                                                )}
                                                <Tooltip title={optionUsedInCondition ? "Možnost je používána v podmínce" : "Smazat"}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                const newOptions = (inputData.options || []).filter((_, i) => i !== idx);
                                                                updateInput({ options: newOptions });
                                                            }}
                                                            color="error"
                                                            disabled={optionUsedInCondition}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        );
                                    })}
                                    <Button
                                        startIcon={<Add />}
                                        size="small"
                                        onClick={() => {
                                            updateInput({ options: [...(inputData.options || []), ""] });
                                        }}
                                    >
                                        Přidat možnost
                                    </Button>
                                </Box>
                            )}
                        </>
                    ) : (
                        <TextField
                            label={editData.type === "heading" ? "Text nadpisu" : "Text popisu"}
                            value={layoutData.text}
                            onChange={(e) => updateLayout({ text: e.target.value })}
                            fullWidth
                            required
                            multiline={editData.type === "description"}
                            rows={editData.type === "description" ? 3 : 1}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Zrušit</Button>
                <Button onClick={handleSave} variant="contained">
                    Uložit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
