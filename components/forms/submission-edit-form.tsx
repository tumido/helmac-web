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

interface SubmissionEditFormProps {
    submissionId: string;
    fields: FormField[];
    data: Record<string, unknown>;
    pricingDefinitions?: PricingDefinition[];
    apFields?: InputField[];
}

export function SubmissionEditForm({ submissionId, fields, data, pricingDefinitions, apFields }: SubmissionEditFormProps) {
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                        const options = def ? def.options.map((o) => o.name) : [];
                        return (
                            <FormControl key={field.id} fullWidth size="small">
                                <InputLabel>{field.label}</InputLabel>
                                <Select
                                    value={String(value ?? "")}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    label={field.label}
                                >
                                    {options.map((opt) => (
                                        <MenuItem key={opt} value={opt}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        );
                    }

                    case "pricing_quantity": {
                        const def = pricingDefinitions?.find((d) => d.id === field.pricingId);
                        return (
                            <TextField
                                key={field.id}
                                label={`${field.label}${def?.unitName ? ` (${def.unitName})` : ""}`}
                                type="number"
                                value={String(value ?? 0)}
                                onChange={(e) => handleChange(field.name, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                                fullWidth
                                size="small"
                                inputProps={{ min: 0, step: 1 }}
                            />
                        );
                    }

                    case "pricing_multi_select": {
                        const msDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                        const msOptions = msDef ? msDef.options.map((o) => o.name) : [];
                        let msSelected: string[] = [];
                        try {
                            const parsed = JSON.parse(String(value ?? "[]"));
                            if (Array.isArray(parsed)) msSelected = parsed;
                        } catch { /* empty */ }
                        return (
                            <Box key={field.id}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>{field.label}</Typography>
                                {msOptions.map((opt) => (
                                    <FormControlLabel
                                        key={opt}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={msSelected.includes(opt)}
                                                onChange={(e) => {
                                                    const newSelected = e.target.checked
                                                        ? [...msSelected, opt]
                                                        : msSelected.filter((s) => s !== opt);
                                                    handleChange(field.name, JSON.stringify(newSelected));
                                                }}
                                            />
                                        }
                                        label={opt}
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
                                            case "select":
                                            case "pricing_select": {
                                                const options = field.type === "pricing_select"
                                                    ? (pricingDefinitions?.find((d) => d.id === field.pricingId)?.options.map((o) => o.name) ?? [])
                                                    : (field.options || []);
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
                                            case "pricing_quantity": {
                                                const qtyDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                                                return (
                                                    <TextField
                                                        key={field.id}
                                                        label={`${field.label}${qtyDef?.unitName ? ` (${qtyDef.unitName})` : ""}`}
                                                        type="number"
                                                        value={String(value ?? 0)}
                                                        onChange={(e) => handleAPChange(personIndex, field.name, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                                                        fullWidth
                                                        size="small"
                                                        inputProps={{ min: 0, step: 1 }}
                                                    />
                                                );
                                            }
                                            case "pricing_multi_select": {
                                                const apMsDef = pricingDefinitions?.find((d) => d.id === field.pricingId);
                                                const apMsOptions = apMsDef ? apMsDef.options.map((o) => o.name) : [];
                                                let apMsSelected: string[] = [];
                                                try {
                                                    const parsed = JSON.parse(String(value ?? "[]"));
                                                    if (Array.isArray(parsed)) apMsSelected = parsed;
                                                } catch { /* empty */ }
                                                return (
                                                    <Box key={field.id}>
                                                        <Typography variant="body2" sx={{ mb: 0.5 }}>{field.label}</Typography>
                                                        {apMsOptions.map((opt) => (
                                                            <FormControlLabel
                                                                key={opt}
                                                                control={
                                                                    <Checkbox
                                                                        size="small"
                                                                        checked={apMsSelected.includes(opt)}
                                                                        onChange={(e) => {
                                                                            const newSel = e.target.checked
                                                                                ? [...apMsSelected, opt]
                                                                                : apMsSelected.filter((s) => s !== opt);
                                                                            handleAPChange(personIndex, field.name, JSON.stringify(newSel));
                                                                        }}
                                                                    />
                                                                }
                                                                label={opt}
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
        </Box>
    );
}
