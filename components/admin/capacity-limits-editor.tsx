"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Add, Delete, Edit, Save } from "@mui/icons-material";
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
    const [savedLimits, setSavedLimits] = useState<CapacityLimit[]>(initialLimits);
    const [editing, setEditing] = useState(initialLimits.length === 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Only fields that have options (select, radio, pricing_select, pricing_multi_select, pricing_quantity)
    const eligibleFields = allInputFields.filter(
        (f) => f.type === "select" || f.type === "radio" || f.type === "pricing_select" || f.type === "pricing_multi_select" || f.type === "pricing_quantity"
    );

    const getUnitNameForField = (fieldId: string): string | undefined => {
        const field = eligibleFields.find((f) => f.id === fieldId);
        if (!field || field.type !== "pricing_quantity" || !field.pricingId) return undefined;
        return pricingDefinitions.find((d) => d.id === field.pricingId)?.unitName;
    };

    const getFieldLabel = (fieldId: string) => {
        return eligibleFields.find((f) => f.id === fieldId)?.label ?? "(neznámé pole)";
    };

    const getOptionsForField = (fieldId: string): string[] => {
        const field = eligibleFields.find((f) => f.id === fieldId);
        if (!field) return [];
        return getFieldOptionValues(field, pricingDefinitions);
    };

    const getCurrentCount = (fieldId: string, value: string): number => {
        const field = eligibleFields.find((f) => f.id === fieldId);
        if (!field) return 0;
        return optionCounts?.[field.name]?.[value] ?? 0;
    };

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

        const validLimits = limits.filter((l) => l.fieldId && l.value && l.maxCount > 0);

        const result = await saveCapacityLimits(yearId, validLimits);

        if (result.error) {
            setError(result.error);
        } else {
            setLimits(validLimits);
            setSavedLimits(validLimits);
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const handleCancel = () => {
        setLimits(savedLimits);
        setEditing(false);
        setError(null);
    };

    // --- Read-only view ---
    if (!editing) {
        return (
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6">
                        Limity kapacity
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
                        Limity kapacity byly uloženy
                    </Alert>
                )}

                {savedLimits.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 1 }}>
                        Zatím nejsou nastaveny žádné limity kapacity.
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {savedLimits.map((limit) => {
                            const currentCount = getCurrentCount(limit.fieldId, limit.value);
                            const ratio = limit.maxCount > 0 ? currentCount / limit.maxCount : 0;
                            const isFull = currentCount >= limit.maxCount;
                            const unitName = getUnitNameForField(limit.fieldId);
                            const chipLabel = unitName
                                ? `${currentCount}/${limit.maxCount} ${unitName}`
                                : `${currentCount}/${limit.maxCount}`;

                            return (
                                <Box
                                    key={limit.id}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        borderRadius: 1,
                                        backgroundColor: "action.hover",
                                    }}
                                >
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        {getFieldLabel(limit.fieldId)}{" "}
                                        <Typography component="span" variant="body2" fontWeight={600}>
                                            {limit.value}
                                        </Typography>
                                    </Typography>

                                    <Box sx={{ width: 80 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(ratio * 100, 100)}
                                            color={isFull ? "error" : ratio >= 0.8 ? "warning" : "primary"}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                    </Box>

                                    <Chip
                                        label={chipLabel}
                                        size="small"
                                        color={isFull ? "error" : "default"}
                                        variant={isFull ? "filled" : "outlined"}
                                        sx={{ minWidth: 56, justifyContent: "center", fontWeight: 600 }}
                                    />
                                </Box>
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
                    Limity kapacity
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {savedLimits.length > 0 && (
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            size="small"
                        >
                            Zrušit
                        </Button>
                    )}
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
                Nastavte maximální počet registrací pro konkrétní možnosti. Po vyčerpání kapacity
                bude možnost zobrazena, ale nelze ji vybrat.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {limits.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                    Zatím nejsou nastaveny žádné limity kapacity.
                </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {limits.map((limit) => {
                    const options = getOptionsForField(limit.fieldId);
                    const currentCount = limit.fieldId && limit.value
                        ? getCurrentCount(limit.fieldId, limit.value)
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
