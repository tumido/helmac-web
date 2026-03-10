"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Add, Delete, Save } from "@mui/icons-material";
import type { CapacityLimit, InputField, PricingDefinition, OptionCounts } from "@/lib/types/registration-form";
import { saveCapacityLimits } from "@/lib/actions/capacity-limits";
import { getFieldOptionValues } from "@/lib/utils/pricing";

interface CapacityLimitsEditorProps {
    yearId: string;
    capacityLimits: CapacityLimit[];
    allInputFields: InputField[];
    pricingDefinitions: PricingDefinition[];
    optionCounts?: OptionCounts;
}

export function CapacityLimitsEditor({
    yearId,
    capacityLimits: initialLimits,
    allInputFields,
    pricingDefinitions,
    optionCounts,
}: CapacityLimitsEditorProps) {
    const [limits, setLimits] = useState<CapacityLimit[]>(initialLimits);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Only fields that have options (select, radio, pricing_select)
    const eligibleFields = allInputFields.filter(
        (f) => f.type === "select" || f.type === "radio" || f.type === "pricing_select"
    );

    const handleAdd = () => {
        setLimits((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                fieldId: "",
                value: "",
                maxCount: 10,
            },
        ]);
    };

    const handleUpdate = (id: string, updates: Partial<CapacityLimit>) => {
        setLimits((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
        );
    };

    const handleDelete = (id: string) => {
        setLimits((prev) => prev.filter((l) => l.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        // Filter out incomplete limits
        const validLimits = limits.filter((l) => l.fieldId && l.value && l.maxCount > 0);

        const result = await saveCapacityLimits(yearId, validLimits);

        if (result.error) {
            setError(result.error);
        } else {
            setLimits(validLimits);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const getOptionsForField = (fieldId: string): string[] => {
        const field = eligibleFields.find((f) => f.id === fieldId);
        if (!field) return [];
        return getFieldOptionValues(field, pricingDefinitions);
    };

    const getCurrentCount = (fieldName: string, value: string): number => {
        return optionCounts?.[fieldName]?.[value] ?? 0;
    };

    const isDirty = JSON.stringify(limits) !== JSON.stringify(initialLimits);

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">
                    Limity kapacity
                </Typography>
                {isDirty && (
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                        size="small"
                    >
                        {saving ? "Ukládám..." : "Uložit limity"}
                    </Button>
                )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nastavte maximální počet registrací pro konkrétní možnosti. Po vyčerpání kapacity
                bude možnost zobrazena, ale nelze ji vybrat.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Limity kapacity byly uloženy
                </Alert>
            )}

            {limits.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                    Zatím nejsou nastaveny žádné limity kapacity.
                </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {limits.map((limit) => {
                    const field = eligibleFields.find((f) => f.id === limit.fieldId);
                    const fieldName = field?.name ?? "";
                    const options = getOptionsForField(limit.fieldId);
                    const currentCount = limit.fieldId && limit.value
                        ? getCurrentCount(fieldName, limit.value)
                        : 0;

                    return (
                        <Card key={limit.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                                    <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                                        <InputLabel>Pole</InputLabel>
                                        <Select
                                            value={limit.fieldId}
                                            onChange={(e) => handleUpdate(limit.id, { fieldId: e.target.value, value: "" })}
                                            label="Pole"
                                        >
                                            {eligibleFields.map((f) => (
                                                <MenuItem key={f.id} value={f.id}>
                                                    {f.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                                        <InputLabel>Možnost</InputLabel>
                                        <Select
                                            value={limit.value}
                                            onChange={(e) => handleUpdate(limit.id, { value: e.target.value })}
                                            label="Možnost"
                                            disabled={!limit.fieldId}
                                        >
                                            {options.map((opt) => (
                                                <MenuItem key={opt} value={opt}>
                                                    {opt}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Max."
                                        type="number"
                                        size="small"
                                        value={limit.maxCount}
                                        onChange={(e) => handleUpdate(limit.id, { maxCount: parseInt(e.target.value) || 1 })}
                                        sx={{ width: 90 }}
                                        inputProps={{ min: 1 }}
                                    />

                                    {limit.fieldId && limit.value && (
                                        <Typography
                                            variant="body2"
                                            color={currentCount >= limit.maxCount ? "error" : "text.secondary"}
                                            sx={{ whiteSpace: "nowrap" }}
                                        >
                                            {currentCount}/{limit.maxCount}
                                        </Typography>
                                    )}

                                    <Tooltip title="Smazat limit">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(limit.id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            <Box
                onClick={handleAdd}
                sx={{
                    mt: 2,
                    p: 2,
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                    },
                }}
            >
                <Add color="action" />
                <Typography variant="body2" color="text.secondary">
                    Přidat limit kapacity
                </Typography>
            </Box>

            {eligibleFields.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Formulář neobsahuje žádná pole s možnostmi (výběr, přepínač, cenový výběr).
                    Nejdříve přidejte taková pole do formuláře.
                </Alert>
            )}
        </Box>
    );
}
