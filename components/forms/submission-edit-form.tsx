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
} from "@mui/material";
import { Save } from "@mui/icons-material";
import type { FormField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { updateSubmissionData } from "@/lib/actions/registration-submissions";

interface SubmissionEditFormProps {
    submissionId: string;
    fields: FormField[];
    data: Record<string, unknown>;
}

export function SubmissionEditForm({ submissionId, fields, data }: SubmissionEditFormProps) {
    const [values, setValues] = useState<Record<string, unknown>>({ ...data });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (name: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const result = await updateSubmissionData(submissionId, values);

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
                                type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                fullWidth
                                size="small"
                                InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                            />
                        );
                }
            })}

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
