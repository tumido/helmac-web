"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    Typography,
} from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import type { InputField, OptionCounts } from "@/lib/types/registration-form";
import { saveShowOptionCounts } from "@/lib/actions/show-option-counts";

interface OptionCountsEditorProps {
    yearId: string;
    showOptionCounts: string[];
    allInputFields: InputField[];
    optionCounts?: OptionCounts;
}

/** Get option values for a field — from field.options or from optionCounts keys */
function getFieldOptions(field: InputField, optionCounts?: OptionCounts): string[] {
    if (field.options && field.options.length > 0) {
        return field.options;
    }
    // Fallback for pricing_select or fields without explicit options: use optionCounts keys
    if (optionCounts?.[field.name]) {
        return Object.keys(optionCounts[field.name]);
    }
    return [];
}

/** Render a vertical list of option counts for a field */
function OptionCountsList({ field, optionCounts }: { field: InputField; optionCounts?: OptionCounts }) {
    const options = getFieldOptions(field, optionCounts);
    if (options.length === 0) return null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {options.map((option) => {
                const count = optionCounts?.[field.name]?.[option] ?? 0;
                return (
                    <Box
                        key={option}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            px: 1,
                            py: 0.25,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {option}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {count}&times;
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

export function OptionCountsEditor({
    yearId,
    showOptionCounts: initialCounts,
    allInputFields,
    optionCounts,
}: OptionCountsEditorProps) {
    const [selected, setSelected] = useState<string[]>(initialCounts);
    const [saved, setSaved] = useState<string[]>(initialCounts);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Only fields with options (select, radio, pricing_select, pricing_multi_select)
    const eligibleFields = allInputFields.filter(
        (f) => f.type === "select" || f.type === "radio" || f.type === "pricing_select" || f.type === "pricing_multi_select"
    );

    const getFieldLabel = (fieldId: string) => {
        return eligibleFields.find((f) => f.id === fieldId)?.label ?? "(neznámé pole)";
    };

    const getFieldById = (fieldId: string) => {
        return eligibleFields.find((f) => f.id === fieldId);
    };

    const handleToggle = (fieldId: string) => {
        setSelected((prev) =>
            prev.includes(fieldId)
                ? prev.filter((id) => id !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const result = await saveShowOptionCounts(yearId, selected);

        if (result.error) {
            setError(result.error);
        } else {
            setSaved(selected);
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const handleCancel = () => {
        setSelected(saved);
        setEditing(false);
        setError(null);
    };

    // --- Read-only view ---
    if (!editing) {
        return (
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6">
                        Zobrazení počtů registrací
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setEditing(true)}
                        size="small"
                    >
                        Upravit
                    </Button>
                </Box>

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Nastavení bylo uloženo
                    </Alert>
                )}

                {saved.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 1 }}>
                        Počty registrací se u žádného pole nezobrazují.
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {saved.map((fieldId) => {
                            const field = getFieldById(fieldId);
                            return (
                                <Card key={fieldId} variant="outlined">
                                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                            {getFieldLabel(fieldId)}
                                        </Typography>
                                        {field ? (
                                            <OptionCountsList field={field} optionCounts={optionCounts} />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Pole nebylo nalezeno
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}
            </Box>
        );
    }

    // --- Edit mode ---
    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">
                    Zobrazení počtů registrací
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCancel}
                        size="small"
                    >
                        Zrušit
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                        size="small"
                    >
                        {saving ? "Ukládám..." : "Uložit"}
                    </Button>
                </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Vyberte pole, u kterých se na veřejné stránce zobrazí aktuální počet registrací u každé možnosti.
                Počty jsou pouze informativní a neblokují výběr.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {eligibleFields.length === 0 ? (
                <Alert severity="info">
                    Formulář neobsahuje žádná pole s možnostmi (výběr, přepínač, cenový výběr).
                </Alert>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {eligibleFields.map((field) => (
                        <Box key={field.id}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selected.includes(field.id)}
                                        onChange={() => handleToggle(field.id)}
                                    />
                                }
                                label={field.label}
                            />
                            {selected.includes(field.id) && (
                                <Box sx={{ ml: 4, mb: 1 }}>
                                    <OptionCountsList field={field} optionCounts={optionCounts} />
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
