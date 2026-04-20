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
import type { FormField, FormCondition, InputField, HeadingField, DescriptionField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField, FIELD_TYPE_META } from "@/lib/types/registration-form";
import { getConditionsUsingOptionValue } from "@/lib/utils/condition-validation";
import { formatPrice } from "@/lib/utils/pricing";

interface FieldEditorProps {
    open: boolean;
    field: FormField | null;
    onClose: () => void;
    onSave: (field: FormField) => void;
    conditions?: FormCondition[];
    pricingDefinitions?: PricingDefinition[];
    priceTiers?: string[];
}

export function FieldEditor({ open, field, onClose, onSave, conditions, pricingDefinitions, priceTiers }: FieldEditorProps) {
    if (!field) return null;

    return (
        <FieldEditorInner
            key={field.id}
            open={open}
            field={field}
            onClose={onClose}
            onSave={onSave}
            conditions={conditions}
            pricingDefinitions={pricingDefinitions}
            priceTiers={priceTiers}
        />
    );
}

function FieldEditorInner({ open, field, onClose, onSave, conditions, pricingDefinitions, priceTiers }: Omit<FieldEditorProps, "field"> & { field: FormField }) {
    const [editData, setEditData] = useState<FormField>(() => structuredClone(field));

    const isInput = isInputField(editData);
    const needsOptions = isInput && (editData.type === "select" || editData.type === "radio");
    const isPricingSelect = isInput && editData.type === "pricing_select";
    const isPricingQuantity = isInput && editData.type === "pricing_quantity";
    const isPricingMultiSelect = isInput && editData.type === "pricing_multi_select";
    const isPricing = isPricingSelect || isPricingQuantity || isPricingMultiSelect;
    const isOptionsBasedPricing = isPricingSelect || isPricingMultiSelect;

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
        <Dialog open={open} maxWidth="sm" fullWidth>
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
                            {!isPricing && (
                                <TextField
                                    label="Placeholder"
                                    value={inputData.placeholder || ""}
                                    onChange={(e) => updateInput({ placeholder: e.target.value || undefined })}
                                    fullWidth
                                />
                            )}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={inputData.required}
                                        onChange={(e) => updateInput({ required: e.target.checked })}
                                    />
                                }
                                label="Povinné pole"
                            />
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={inputData.includeForAdditionalPeople ?? false}
                                            onChange={(e) => updateInput({ includeForAdditionalPeople: e.target.checked || undefined })}
                                        />
                                    }
                                    label="Další osoby"
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4, mt: -0.5 }}>
                                    Pole bude zobrazeno i pro další přidané osoby
                                </Typography>
                            </Box>

                            {isOptionsBasedPricing && (() => {
                                const def = pricingDefinitions?.find((d) => d.id === inputData.pricingId);
                                return (
                                    <Box sx={{ p: 2, backgroundColor: "action.hover", borderRadius: 1 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Cenová skupina: {def?.name || "(nenalezena)"}
                                        </Typography>
                                        {def && (() => {
                                            const defTiers = def.usePriceTiers ? (priceTiers ?? []) : [];
                                            return (
                                                <>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {def.options.length} {def.options.length === 1 ? "možnost" : "možnosti"}{def.usePriceTiers ? ` · ${defTiers.length} ${defTiers.length === 1 ? "termín" : "termíny"}` : " · paušální cena"}
                                                    </Typography>
                                                    <Box sx={{ mt: 1 }}>
                                                        {def.options.map((opt) => (
                                                            <Typography key={opt.id} variant="body2" sx={{ mb: 0.5 }}>
                                                                {opt.name}{opt.description ? ` — ${opt.description}` : ""} ({defTiers.map((_, i) => formatPrice(opt.prices[i])).join(" / ")}
                                                                {defTiers.length > 0 ? " / " : ""}{formatPrice(opt.prices[defTiers.length])})
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                </>
                                            );
                                        })()}
                                        <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block" }}>
                                            Upravit ceny v záložce Ceník
                                        </Typography>
                                    </Box>
                                );
                            })()}

                            {isPricingQuantity && (() => {
                                const def = pricingDefinitions?.find((d) => d.id === inputData.pricingId);
                                const unitOpt = def?.options[0];
                                return (
                                    <Box sx={{ p: 2, backgroundColor: "action.hover", borderRadius: 1 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Cenový počet: {def?.name || "(nenalezena)"}
                                        </Typography>
                                        {def && (() => {
                                            const defTiersQ = def.usePriceTiers ? (priceTiers ?? []) : [];
                                            return (
                                                <>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Jednotka: {def.unitName || "(nenastavena)"}{def.usePriceTiers ? ` · ${defTiersQ.length} ${defTiersQ.length === 1 ? "termín" : "termíny"}` : " · paušální cena"}
                                                    </Typography>
                                                    {unitOpt && (
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            Cena za jednotku: {defTiersQ.map((_, i) => formatPrice(unitOpt.prices[i])).join(" / ")}
                                                            {defTiersQ.length > 0 ? " / " : ""}{formatPrice(unitOpt.prices[defTiersQ.length])}
                                                        </Typography>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <Typography variant="caption" color="primary" sx={{ mt: 1, display: "block" }}>
                                            Upravit ceny v záložce Ceník
                                        </Typography>
                                    </Box>
                                );
                            })()}

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
