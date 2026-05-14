"use client";

import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    Radio,
    Typography,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
} from "@mui/material";
import { Save, ExpandMore, Delete } from "@mui/icons-material";
import type { FormField, InputField, PricingDefinition, AdditionalPersonData } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { updateSubmissionData } from "@/lib/actions/registration-submissions";
import { parseQuantities, parseSelected } from "@/lib/utils/pricing-field-values";

interface SubmissionEditFormProps {
    submissionId: string;
    fields: FormField[];
    data: Record<string, unknown>;
    pricingDefinitions?: PricingDefinition[];
    apFields?: InputField[];
    readOnly?: boolean;
}

export function SubmissionEditForm({ submissionId, fields, data, pricingDefinitions, apFields, readOnly = false }: SubmissionEditFormProps) {
    const [values, setValues] = useState<Record<string, unknown>>({ ...data });
    const [apPeople, setAPPeople] = useState<AdditionalPersonData[]>(() => {
        const ap = data.additionalPeople;
        return Array.isArray(ap) ? (ap as AdditionalPersonData[]) : [];
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (name: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleAPChange = (personIndex: number, name: string, value: string | number | boolean) => {
        setAPPeople((prev) => {
            const updated = [...prev];
            updated[personIndex] = { ...updated[personIndex], [name]: value };
            return updated;
        });
    };

    const handleRemoveAPPerson = (personIndex: number) => {
        setAPPeople((prev) => prev.filter((_, i) => i !== personIndex));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const saveData = { ...values };
        if (apPeople.length > 0) {
            saveData.additionalPeople = apPeople as unknown as Record<string, unknown>[];
        } else {
            delete saveData.additionalPeople;
        }

        const result = await updateSubmissionData(submissionId, saveData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    return (
        <Box
            component="fieldset"
            disabled={readOnly}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                border: "none",
                p: 0,
                m: 0,
                minWidth: 0,
            }}
        >
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Data byla uložena</Alert>}

            {fields.map((field) => {
                if (!isInputField(field)) return null;

                const value = values[field.name];

                switch (field.type) {
                    case "checkbox":
                        return (
                            <FormControlLabel
                                key={field.id}
                                control={
                                    <Checkbox
                                        checked={!!value}
                                        onChange={(e) => handleChange(field.name, e.target.checked)}
                                    />
                                }
                                label={field.label}
                            />
                        );

                    case "select":
                        return (
                            <FormControl key={field.id} fullWidth size="small">
                                <InputLabel>{field.label}</InputLabel>
                                <Select
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    label={field.label}
                                >
                                    {(field.options || []).map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        );

                    case "radio":
                        return (
                            <FormControl key={field.id}>
                                <Typography variant="body2">{field.label}</Typography>
                                <RadioGroup
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                >
                                    {(field.options || []).map((opt) => (
                                        <FormControlLabel
                                            key={opt}
                                            value={opt}
                                            control={<Radio size="small" />}
                                            label={opt}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        );

                    case "pricing_select": {
                        const def = pricingDefinitions?.find((d) => d.id === field.pricingId);
                        const options = def?.options ?? [];
                        // Legacy submissions may hold the option name; map it to the id.
                        const currentRaw = String(value ?? "");
                        const currentId =
                            options.find((o) => o.id === currentRaw)?.id
                            ?? options.find((o) => o.name === currentRaw)?.id
                            ?? "";
                        return (
                            <FormControl key={field.id} fullWidth size="small">
                                <InputLabel>{field.label}</InputLabel>
                                <Select
                                    value={currentId}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    label={field.label}
                                >
                                    {options.map((opt) => (
                                        <MenuItem key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        );
                    }

                    case "pricing_quantity": {
                        const def = pricingDefinitions?.find((d) => d.id === field.pricingId);
                        const options = def?.options ?? [];
                        const qMap = parseQuantities(value);
                        return (
                            <Box key={field.id}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {field.label}{def?.unitName ? ` (${def.unitName})` : ""}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                    {options.map((opt) => (
                                        <TextField
                                            key={opt.id}
                                            label={opt.name}
                                            type="number"
                                            value={String(Number(qMap[opt.id] ?? qMap[opt.name] ?? 0))}
                                            onChange={(e) => {
                                                const qty = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                                const next: Record<string, number> = { ...qMap };
                                                if (qty > 0) {
                                                    next[opt.id] = qty;
                                                } else {
                                                    delete next[opt.id];
                                                }
                                                // Drop any legacy name-keyed entry for this option.
                                                if (opt.name !== opt.id) delete next[opt.name];
                                                handleChange(field.name, JSON.stringify(next));
                                            }}
                                            fullWidth
                                            size="small"
                                            inputProps={{ min: 0, step: 1 }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        );
                    }

                    case "pricing_multi_select": {
                        const msDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                        const msOptions = msDef?.options ?? [];
                        const rawSelected = parseSelected(value);
                        // Legacy submissions may hold option names; normalise to ids for comparison.
                        const msSelectedIds = rawSelected
                            .map((v) =>
                                msOptions.find((o) => o.id === v)?.id
                                ?? msOptions.find((o) => o.name === v)?.id
                                ?? v,
                            );
                        return (
                            <Box key={field.id}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>{field.label}</Typography>
                                {msOptions.map((opt) => (
                                    <FormControlLabel
                                        key={opt.id}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={msSelectedIds.includes(opt.id)}
                                                onChange={(e) => {
                                                    const newSelected = e.target.checked
                                                        ? [...msSelectedIds, opt.id]
                                                        : msSelectedIds.filter((s) => s !== opt.id);
                                                    handleChange(field.name, JSON.stringify(newSelected));
                                                }}
                                            />
                                        }
                                        label={opt.name}
                                    />
                                ))}
                            </Box>
                        );
                    }

                    case "textarea":
                        return (
                            <TextField
                                key={field.id}
                                label={field.label}
                                value={String(value ?? "")}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                size="small"
                            />
                        );

                    default:
                        return (
                            <TextField
                                key={field.id}
                                label={field.label}
                                value={String(value ?? "")}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                type={field.type === "email" ? "email" : field.type === "number" ? "number" : (field.type === "date" || field.type === "birth_date") ? "date" : "text"}
                                fullWidth
                                size="small"
                                InputLabelProps={(field.type === "date" || field.type === "birth_date") ? { shrink: true } : undefined}
                            />
                        );
                }
            })}

            {apFields && apFields.length > 0 && apPeople.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        Další osoby ({apPeople.length})
                    </Typography>
                    {apPeople.map((person, personIndex) => (
                        <Accordion key={personIndex} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                                    <Typography>Osoba č. {personIndex + 2}</Typography>
                                    <Box sx={{ flex: 1 }} />
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveAPPerson(personIndex);
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {apFields.map((field) => {
                                        const value = person[field.name];
                                        switch (field.type) {
                                            case "checkbox":
                                                return (
                                                    <FormControlLabel
                                                        key={field.id}
                                                        control={
                                                            <Checkbox
                                                                checked={!!value}
                                                                onChange={(e) => handleAPChange(personIndex, field.name, e.target.checked)}
                                                            />
                                                        }
                                                        label={field.label}
                                                    />
                                                );
                                            case "select": {
                                                const options = field.options || [];
                                                return (
                                                    <FormControl key={field.id} fullWidth size="small">
                                                        <InputLabel>{field.label}</InputLabel>
                                                        <Select
                                                            value={String(value ?? "")}
                                                            onChange={(e) => handleAPChange(personIndex, field.name, e.target.value)}
                                                            label={field.label}
                                                        >
                                                            {options.map((opt) => (
                                                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                );
                                            }
                                            case "pricing_select": {
                                                const apDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                                                const apOptions = apDef?.options ?? [];
                                                const apRaw = String(value ?? "");
                                                const apCurrentId =
                                                    apOptions.find((o) => o.id === apRaw)?.id
                                                    ?? apOptions.find((o) => o.name === apRaw)?.id
                                                    ?? "";
                                                return (
                                                    <FormControl key={field.id} fullWidth size="small">
                                                        <InputLabel>{field.label}</InputLabel>
                                                        <Select
                                                            value={apCurrentId}
                                                            onChange={(e) => handleAPChange(personIndex, field.name, e.target.value)}
                                                            label={field.label}
                                                        >
                                                            {apOptions.map((opt) => (
                                                                <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                );
                                            }
                                            case "pricing_quantity": {
                                                const qtyDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                                                const qtyOptions = qtyDef?.options ?? [];
                                                const qMap = parseQuantities(value);
                                                return (
                                                    <Box key={field.id}>
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                            {field.label}{qtyDef?.unitName ? ` (${qtyDef.unitName})` : ""}
                                                        </Typography>
                                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                            {qtyOptions.map((opt) => (
                                                                <TextField
                                                                    key={opt.id}
                                                                    label={opt.name}
                                                                    type="number"
                                                                    value={String(Number(qMap[opt.id] ?? qMap[opt.name] ?? 0))}
                                                                    onChange={(e) => {
                                                                        const qty = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                                                        const next: Record<string, number> = { ...qMap };
                                                                        if (qty > 0) {
                                                                            next[opt.id] = qty;
                                                                        } else {
                                                                            delete next[opt.id];
                                                                        }
                                                                        if (opt.name !== opt.id) delete next[opt.name];
                                                                        handleAPChange(personIndex, field.name, JSON.stringify(next));
                                                                    }}
                                                                    fullWidth
                                                                    size="small"
                                                                    inputProps={{ min: 0, step: 1 }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                );
                                            }
                                            case "pricing_multi_select": {
                                                const apMsDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                                                const apMsOptions = apMsDef?.options ?? [];
                                                const apRawSelected = parseSelected(value);
                                                const apMsSelectedIds = apRawSelected.map((v) =>
                                                    apMsOptions.find((o) => o.id === v)?.id
                                                    ?? apMsOptions.find((o) => o.name === v)?.id
                                                    ?? v,
                                                );
                                                return (
                                                    <Box key={field.id}>
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>{field.label}</Typography>
                                                        {apMsOptions.map((opt) => (
                                                            <FormControlLabel
                                                                key={opt.id}
                                                                control={
                                                                    <Checkbox
                                                                        size="small"
                                                                        checked={apMsSelectedIds.includes(opt.id)}
                                                                        onChange={(e) => {
                                                                            const newSel = e.target.checked
                                                                                ? [...apMsSelectedIds, opt.id]
                                                                                : apMsSelectedIds.filter((s) => s !== opt.id);
                                                                            handleAPChange(personIndex, field.name, JSON.stringify(newSel));
                                                                        }}
                                                                    />
                                                                }
                                                                label={opt.name}
                                                            />
                                                        ))}
                                                    </Box>
                                                );
                                            }
                                            case "radio":
                                                return (
                                                    <FormControl key={field.id}>
                                                        <Typography variant="body2">{field.label}</Typography>
                                                        <RadioGroup
                                                            value={String(value ?? "")}
                                                            onChange={(e) => handleAPChange(personIndex, field.name, e.target.value)}
                                                        >
                                                            {(field.options || []).map((opt) => (
                                                                <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                );
                                            case "textarea":
                                                return (
                                                    <TextField
                                                        key={field.id}
                                                        label={field.label}
                                                        value={String(value ?? "")}
                                                        onChange={(e) => handleAPChange(personIndex, field.name, e.target.value)}
                                                        multiline rows={3} fullWidth size="small"
                                                    />
                                                );
                                            default:
                                                return (
                                                    <TextField
                                                        key={field.id}
                                                        label={field.label}
                                                        value={String(value ?? "")}
                                                        onChange={(e) => handleAPChange(personIndex, field.name, e.target.value)}
                                                        type={field.type === "email" ? "email" : field.type === "number" ? "number" : (field.type === "date" || field.type === "birth_date") ? "date" : "text"}
                                                        fullWidth size="small"
                                                        InputLabelProps={(field.type === "date" || field.type === "birth_date") ? { shrink: true } : undefined}
                                                    />
                                                );
                                        }
                                    })}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {!readOnly && (
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Ukládám..." : "Uložit změny"}
                    </Button>
                </Box>
            )}
        </Box>
    );
}
