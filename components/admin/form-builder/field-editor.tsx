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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import type { FormField, InputField, HeadingField, DescriptionField, FieldCondition } from "@/lib/types/registration-form";
import { isInputField, FIELD_TYPE_META } from "@/lib/types/registration-form";

interface FieldEditorProps {
    open: boolean;
    field: FormField | null;
    allFields: FormField[]; // For condition target selection
    onClose: () => void;
    onSave: (field: FormField) => void;
}

export function FieldEditor({ open, field, allFields, onClose, onSave }: FieldEditorProps) {
    if (!field) return null;

    return (
        <FieldEditorInner
            key={field.id}
            open={open}
            field={field}
            allFields={allFields}
            onClose={onClose}
            onSave={onSave}
        />
    );
}

function FieldEditorInner({ open, field, allFields, onClose, onSave }: Omit<FieldEditorProps, "field"> & { field: FormField }) {
    const [editData, setEditData] = useState<FormField>(() => structuredClone(field));

    const isInput = isInputField(editData);
    const needsOptions = isInput && (editData.type === "select" || editData.type === "radio");

    // Available fields for conditions (input fields except this one)
    const conditionTargets = allFields.filter(
        (f) => isInputField(f) && f.id !== editData.id && (f.type === "select" || f.type === "radio" || f.type === "checkbox")
    );

    const handleSave = () => {
        if (!editData) return;
        onSave(editData);
        onClose();
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
                                    {(inputData.options || []).map((opt, idx) => (
                                        <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1 }}>
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
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const newOptions = (inputData.options || []).filter((_, i) => i !== idx);
                                                    updateInput({ options: newOptions });
                                                }}
                                                color="error"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
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

                            {conditionTargets.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Podmínka zobrazení
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={!!inputData.condition}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const target = conditionTargets[0] as InputField;
                                                        updateInput({
                                                            condition: {
                                                                fieldId: target.id,
                                                                operator: "equals",
                                                                value: "",
                                                            },
                                                        });
                                                    } else {
                                                        updateInput({ condition: undefined });
                                                    }
                                                }}
                                            />
                                        }
                                        label="Zobrazit pouze pokud..."
                                    />
                                    {inputData.condition && (
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Pole</InputLabel>
                                                <Select
                                                    value={inputData.condition.fieldId}
                                                    onChange={(e) =>
                                                        updateInput({
                                                            condition: {
                                                                ...inputData.condition!,
                                                                fieldId: e.target.value,
                                                            },
                                                        })
                                                    }
                                                    label="Pole"
                                                >
                                                    {conditionTargets.map((f) => (
                                                        <MenuItem key={f.id} value={f.id}>
                                                            {(f as InputField).label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Operátor</InputLabel>
                                                <Select
                                                    value={inputData.condition.operator}
                                                    onChange={(e) =>
                                                        updateInput({
                                                            condition: {
                                                                ...inputData.condition!,
                                                                operator: e.target.value as FieldCondition["operator"],
                                                            },
                                                        })
                                                    }
                                                    label="Operátor"
                                                >
                                                    <MenuItem value="equals">se rovná</MenuItem>
                                                    <MenuItem value="not_equals">se nerovná</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <ConditionValueInput
                                                condition={inputData.condition}
                                                allFields={allFields}
                                                onChange={(value) =>
                                                    updateInput({
                                                        condition: { ...inputData.condition!, value },
                                                    })
                                                }
                                            />
                                        </Box>
                                    )}
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

// Helper component for condition value input
function ConditionValueInput({
    condition,
    allFields,
    onChange,
}: {
    condition: FieldCondition;
    allFields: FormField[];
    onChange: (value: string) => void;
}) {
    const targetField = allFields.find((f) => f.id === condition.fieldId);

    if (!targetField || !isInputField(targetField)) {
        return null;
    }

    if (targetField.type === "checkbox") {
        return (
            <FormControl size="small" fullWidth>
                <InputLabel>Hodnota</InputLabel>
                <Select value={condition.value} onChange={(e) => onChange(e.target.value)} label="Hodnota">
                    <MenuItem value="true">Zaškrtnuto</MenuItem>
                    <MenuItem value="false">Nezaškrtnuto</MenuItem>
                </Select>
            </FormControl>
        );
    }

    if ((targetField.type === "select" || targetField.type === "radio") && targetField.options) {
        return (
            <FormControl size="small" fullWidth>
                <InputLabel>Hodnota</InputLabel>
                <Select value={condition.value} onChange={(e) => onChange(e.target.value)} label="Hodnota">
                    {targetField.options.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                            {opt}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    return (
        <TextField
            label="Hodnota"
            value={condition.value}
            onChange={(e) => onChange(e.target.value)}
            size="small"
            fullWidth
        />
    );
}
