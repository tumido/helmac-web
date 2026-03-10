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
import type { FormField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { getCurrentTierIndex, formatPrice } from "@/lib/utils/pricing";

interface DynamicFormFieldProps {
    field: FormField;
    value: string | number | boolean;
    error?: string;
    onChange: (name: string, value: string | number | boolean) => void;
    pricingDefinitions?: PricingDefinition[];
    namePrefix?: string; // Prefix for HTML name attributes (used by AP fields to avoid DOM conflicts)
    disabledOptions?: Set<string>; // Option values that are at capacity
}

export function DynamicFormField({ field, value, error, onChange, pricingDefinitions, namePrefix, disabledOptions }: DynamicFormFieldProps) {
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
    const htmlName = (namePrefix ?? "") + field.name;

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
                    <input type="hidden" name={htmlName} value={String(!!value)} />
                    {error && <FormHelperText error>{error}</FormHelperText>}
                </Box>
            );

        case "select":
            return (
                <FormControl fullWidth error={!!error}>
                    <InputLabel>{label}</InputLabel>
                    <Select
                        name={htmlName}
                        value={String(value)}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        label={label}
                    >
                        <MenuItem value="">
                            <em>Vyberte...</em>
                        </MenuItem>
                        {(field.options || []).map((opt) => {
                            const isDisabled = disabledOptions?.has(opt) ?? false;
                            return (
                                <MenuItem key={opt} value={opt} disabled={isDisabled}>
                                    {opt}{isDisabled ? " (Kapacita vyčerpána)" : ""}
                                </MenuItem>
                            );
                        })}
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
                        name={htmlName}
                        value={String(value)}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    >
                        {(field.options || []).map((opt) => {
                            const isDisabled = disabledOptions?.has(opt) ?? false;
                            return (
                                <FormControlLabel
                                    key={opt}
                                    value={opt}
                                    control={<Radio />}
                                    label={isDisabled ? `${opt} (Kapacita vyčerpána)` : opt}
                                    disabled={isDisabled}
                                />
                            );
                        })}
                    </RadioGroup>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>
            );

        case "textarea":
            return (
                <TextField
                    name={htmlName}
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
                    name={htmlName}
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
        case "birth_date":
            return (
                <TextField
                    name={htmlName}
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
                    name={htmlName}
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

        case "pricing_select": {
            const def = pricingDefinitions?.find((d) => d.id === field.pricingId);
            if (!def) return null;
            const currentTier = getCurrentTierIndex(def.priceTiers);
            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {label}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {def.options.map((opt) => {
                            const isSelected = String(value) === opt.name;
                            const isDisabled = disabledOptions?.has(opt.name) ?? false;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() => !isDisabled && onChange(field.name, opt.name)}
                                    sx={{
                                        p: 2,
                                        border: "2px solid",
                                        borderColor: isDisabled ? "action.disabled" : isSelected ? "primary.main" : "divider",
                                        borderRadius: 1,
                                        backgroundColor: isDisabled ? "action.disabledBackground" : isSelected ? "primary.50" : "transparent",
                                        cursor: isDisabled ? "not-allowed" : "pointer",
                                        opacity: isDisabled ? 0.6 : 1,
                                        "&:hover": isDisabled ? {} : {
                                            borderColor: isSelected ? "primary.main" : "action.selected",
                                        },
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                            {opt.name}
                                        </Typography>
                                        {isDisabled && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    backgroundColor: "error.main",
                                                    color: "error.contrastText",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Kapacita vyčerpána
                                            </Typography>
                                        )}
                                    </Box>
                                    {opt.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {opt.description}
                                        </Typography>
                                    )}
                                    {opt.prices.some((p: number) => p !== 0) && (
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.5 }}>
                                            {def.priceTiers.map((tier, idx) => {
                                                if (opt.prices[idx] === 0) return null;
                                                const isCurrent = idx === currentTier;
                                                return (
                                                    <Typography
                                                        key={idx}
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: isCurrent ? 700 : 400,
                                                            color: isCurrent ? "primary.main" : "text.secondary",
                                                        }}
                                                    >
                                                        {isCurrent && "► "}do {new Date(tier).toLocaleDateString("cs-CZ")}: {formatPrice(opt.prices[idx])}
                                                    </Typography>
                                                );
                                            })}
                                            {opt.prices[def.priceTiers.length] !== 0 && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: currentTier === def.priceTiers.length ? 700 : 400,
                                                        color: currentTier === def.priceTiers.length ? "primary.main" : "text.secondary",
                                                    }}
                                                >
                                                    {currentTier === def.priceTiers.length && "► "}{def.priceTiers.length > 0 ? "na místě: " : ""}{formatPrice(opt.prices[def.priceTiers.length])}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                    <input type="hidden" name={htmlName} value={String(value)} />
                    {error && <FormHelperText error>{error}</FormHelperText>}
                </Box>
            );
        }

        case "text":
        default:
            return (
                <TextField
                    name={htmlName}
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
