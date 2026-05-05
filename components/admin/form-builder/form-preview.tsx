"use client";

import {
    Box,
    TextField,
    Typography,
    Divider,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    Radio,
    Paper,
} from "@mui/material";
import type {
    FormField,
    FormElement,
    FormCondition,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { isInputField, isConditionBlock } from "@/lib/types/registration-form";
import { getCurrentPrice, formatPrice } from "@/lib/utils/pricing";

interface FormPreviewProps {
    elements: FormElement[];
    conditions: FormCondition[];
    pricingDefinitions?: PricingDefinition[];
    priceTiers?: string[];
}

export function FormPreview({
    elements,
    conditions,
    pricingDefinitions,
    priceTiers,
}: FormPreviewProps) {
    if (elements.length === 0) {
        return (
            <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
            >
                Formulář je prázdný. Přidejte pole pomocí tlačítka výše.
            </Typography>
        );
    }

    return (
        <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 2 }}
            >
                Náhled formuláře
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {elements.map((el) => {
                    if (isConditionBlock(el)) {
                        const condition = conditions.find(
                            (c) => c.id === el.conditionId
                        );
                        return (
                            <Box
                                key={el.id}
                                sx={{
                                    borderLeft: "4px solid",
                                    borderLeftColor: "info.main",
                                    pl: 2,
                                    py: 1,
                                    backgroundColor: "action.hover",
                                    borderRadius: 1,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="info.main"
                                    fontWeight={600}
                                    sx={{ mb: 1, display: "block" }}
                                >
                                    Podmínka:{" "}
                                    {condition?.name || "(nepojmenovaná)"}
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                    }}
                                >
                                    {el.children.map((child) => (
                                        <PreviewField
                                            key={child.id}
                                            field={child}
                                            pricingDefinitions={
                                                pricingDefinitions
                                            }
                                            priceTiers={priceTiers}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        );
                    }
                    return (
                        <PreviewField
                            key={el.id}
                            field={el}
                            pricingDefinitions={pricingDefinitions}
                            priceTiers={priceTiers}
                        />
                    );
                })}
            </Box>
        </Paper>
    );
}

function PreviewField({
    field,
    pricingDefinitions,
    priceTiers,
}: {
    field: FormField;
    pricingDefinitions?: PricingDefinition[];
    priceTiers?: string[];
}) {
    if (!isInputField(field)) {
        if (field.type === "heading") {
            return (
                <Box>
                    <Typography variant="h5" sx={{ mt: 1 }}>
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

    switch (field.type) {
        case "checkbox":
            return (
                <FormControlLabel
                    control={<Checkbox disabled />}
                    label={`${field.label}${field.required ? " *" : ""}`}
                />
            );

        case "select":
            return (
                <FormControl fullWidth disabled>
                    <InputLabel>{`${field.label}${field.required ? " *" : ""}`}</InputLabel>
                    <Select
                        value=""
                        label={`${field.label}${field.required ? " *" : ""}`}
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
                <FormControl disabled>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {field.label}
                        {field.required ? " *" : ""}
                    </Typography>
                    <RadioGroup>
                        {(field.options || []).map((opt) => (
                            <FormControlLabel
                                key={opt}
                                value={opt}
                                control={<Radio />}
                                label={opt}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            );

        case "pricing_select": {
            const def = pricingDefinitions?.find(
                (d) => d.id === field.pricingId
            );
            if (!def)
                return (
                    <Typography variant="body2" color="error">
                        Cenová skupina nenalezena
                    </Typography>
                );
            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {field.label}
                        {field.required ? " *" : ""}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        {def.options.map((opt) => {
                            const price = getCurrentPrice(
                                def.usePriceTiers ? (priceTiers ?? []) : [],
                                opt.prices
                            );
                            return (
                                <Paper
                                    key={opt.id}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            fontWeight={500}
                                        >
                                            {opt.name}
                                        </Typography>
                                        {opt.description && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {opt.description}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color="primary"
                                    >
                                        {formatPrice(price)}
                                    </Typography>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "pricing_quantity": {
            const def = pricingDefinitions?.find(
                (d) => d.id === field.pricingId
            );
            if (!def)
                return (
                    <Typography variant="body2" color="error">
                        Cenová skupina nenalezena
                    </Typography>
                );
            const unitOpt = def.options[0];
            const unitPrice = unitOpt
                ? getCurrentPrice(
                      def.usePriceTiers ? (priceTiers ?? []) : [],
                      unitOpt.prices
                  )
                : 0;
            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {field.label}
                        {field.required ? " *" : ""}
                    </Typography>
                    {unitOpt?.description && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: "block" }}
                        >
                            {unitOpt.description}
                        </Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <TextField
                            type="number"
                            size="small"
                            disabled
                            value={0}
                            sx={{ width: 120 }}
                            inputProps={{ min: 0 }}
                        />
                        {def.unitName && (
                            <Typography variant="body2" color="text.secondary">
                                {def.unitName}
                            </Typography>
                        )}
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color="info.main"
                        >
                            {formatPrice(unitPrice)} / {def.unitName || "ks"}
                        </Typography>
                    </Box>
                </Box>
            );
        }

        case "pricing_multi_select": {
            const msDef = pricingDefinitions?.find(
                (d) => d.id === field.pricingId
            );
            if (!msDef)
                return (
                    <Typography variant="body2" color="error">
                        Cenová skupina nenalezena
                    </Typography>
                );
            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {field.label}
                        {field.required ? " *" : ""} (vícevýběr)
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        {msDef.options.map((opt) => {
                            const price = getCurrentPrice(
                                msDef.usePriceTiers ? (priceTiers ?? []) : [],
                                opt.prices
                            );
                            return (
                                <Paper
                                    key={opt.id}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Checkbox disabled size="small" />
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                            >
                                                {opt.name}
                                            </Typography>
                                            {opt.description && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {opt.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color="primary"
                                    >
                                        {formatPrice(price)}
                                    </Typography>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "textarea":
            return (
                <TextField
                    label={`${field.label}${field.required ? " *" : ""}`}
                    placeholder={field.placeholder}
                    multiline
                    rows={4}
                    fullWidth
                    disabled
                />
            );

        default:
            return (
                <TextField
                    label={`${field.label}${field.required ? " *" : ""}`}
                    placeholder={field.placeholder}
                    type={
                        field.type === "email"
                            ? "email"
                            : field.type === "number"
                              ? "number"
                              : field.type === "date" ||
                                  field.type === "birth_date"
                                ? "date"
                                : "text"
                    }
                    fullWidth
                    disabled
                    InputLabelProps={
                        field.type === "date" || field.type === "birth_date"
                            ? { shrink: true }
                            : undefined
                    }
                />
            );
    }
}
