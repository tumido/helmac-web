"use client";

import {
    TextField,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    Radio,
    FormHelperText,
    Typography,
    Divider,
    Box,
} from "@mui/material";
import type { FormField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";

interface DynamicFormFieldProps {
    field: FormField;
    value: string | number | boolean;
    error?: string;
    onChange: (name: string, value: string | number | boolean) => void;
}

export function DynamicFormField({ field, value, error, onChange }: DynamicFormFieldProps) {
    if (!isInputField(field)) {
        if (field.type === "heading") {
            return (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        {field.text}
                    </Typography>
                    <Divider />
                </Box>
            );
        }
        return (
            <Typography variant="body1" color="text.secondary">
                {field.text}
            </Typography>
        );
    }

    const label = `${field.label}${field.required ? " *" : ""}`;

    switch (field.type) {
        case "checkbox":
            return (
                <Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!value}
                                onChange={(e) => onChange(field.name, e.target.checked)}
                            />
                        }
                        label={label}
                    />
                    <input type="hidden" name={field.name} value={String(!!value)} />
                    {error && <FormHelperText error>{error}</FormHelperText>}
                </Box>
            );

        case "select":
            return (
                <FormControl fullWidth error={!!error}>
                    <InputLabel>{label}</InputLabel>
                    <Select
                        name={field.name}
                        value={String(value)}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        label={label}
                    >
                        <MenuItem value="">
                            <em>Vyberte...</em>
                        </MenuItem>
                        {(field.options || []).map((opt) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>
            );

        case "radio":
            return (
                <FormControl error={!!error}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {label}
                    </Typography>
                    <RadioGroup
                        name={field.name}
                        value={String(value)}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    >
                        {(field.options || []).map((opt) => (
                            <FormControlLabel
                                key={opt}
                                value={opt}
                                control={<Radio />}
                                label={opt}
                            />
                        ))}
                    </RadioGroup>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>
            );

        case "textarea":
            return (
                <TextField
                    name={field.name}
                    label={label}
                    placeholder={field.placeholder}
                    value={String(value)}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    error={!!error}
                    helperText={error}
                    multiline
                    rows={4}
                    fullWidth
                />
            );

        case "number":
            return (
                <TextField
                    name={field.name}
                    label={label}
                    placeholder={field.placeholder}
                    type="number"
                    value={String(value)}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    error={!!error}
                    helperText={error}
                    fullWidth
                />
            );

        case "date":
            return (
                <TextField
                    name={field.name}
                    label={label}
                    type="date"
                    value={String(value)}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    error={!!error}
                    helperText={error}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
            );

        case "email":
            return (
                <TextField
                    name={field.name}
                    label={label}
                    placeholder={field.placeholder}
                    type="email"
                    value={String(value)}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    error={!!error}
                    helperText={error}
                    fullWidth
                />
            );

        case "text":
        default:
            return (
                <TextField
                    name={field.name}
                    label={label}
                    placeholder={field.placeholder}
                    value={String(value)}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    error={!!error}
                    helperText={error}
                    fullWidth
                />
            );
    }
}
