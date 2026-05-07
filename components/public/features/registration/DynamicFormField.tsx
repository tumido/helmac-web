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
    Box,
    Collapse,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { DecorativeDivider } from "@/components/public/ui";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type {
    FormField,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { getCurrentTierIndex, formatPrice } from "@/lib/utils/pricing";
import { formatDate } from "@/lib/utils/date";
import dayjs from "dayjs";

interface DynamicFormFieldProps {
    field: FormField;
    value: string | number | boolean;
    error?: string;
    onChange: (name: string, value: string | number | boolean) => void;
    pricingDefinitions?: PricingDefinition[];
    priceTiers?: string[];
    namePrefix?: string; // Prefix for HTML name attributes (used by AP fields to avoid DOM conflicts)
    disabledOptions?: Set<string>; // Option values that are at capacity
}

export function DynamicFormField({
    field,
    value,
    error,
    onChange,
    pricingDefinitions,
    priceTiers,
    namePrefix,
    disabledOptions,
}: DynamicFormFieldProps) {
    const [showAllTiers, setShowAllTiers] = useState(false);

    if (!isInputField(field)) {
        if (field.type === "heading") {
            return (
                <Box id={`section-${field.id}`} sx={{ mt: 4 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            color: "primary.main",
                            textAlign: "center",
                            mb: 1,
                        }}
                    >
                        {field.text}
                    </Typography>
                    <DecorativeDivider variant="ornate" my={2} />
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
                                onChange={(e) =>
                                    onChange(field.name, e.target.checked)
                                }
                            />
                        }
                        label={label}
                    />
                    <input
                        type="hidden"
                        name={htmlName}
                        value={String(!!value)}
                    />
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
                            const isDisabled =
                                disabledOptions?.has(opt) ?? false;
                            return (
                                <MenuItem
                                    key={opt}
                                    value={opt}
                                    disabled={isDisabled}
                                >
                                    {opt}
                                    {isDisabled ? " (Kapacita vyčerpána)" : ""}
                                </MenuItem>
                            );
                        })}
                    </Select>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>
            );

        case "radio": {
            const options = field.options || [];
            const isBinary = options.length === 2;

            if (field.displayVariant === "image_cards" && options.length > 0) {
                return (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {label}
                        </Typography>
                        <Box
                            role="radiogroup"
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                                my: 1,
                            }}
                        >
                            {options.map((opt) => {
                                const isSelected = String(value) === opt;
                                const isDisabled = disabledOptions?.has(opt) ?? false;
                                const meta = field.optionMeta?.[opt];
                                return (
                                    <Box
                                        key={opt}
                                        role="radio"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        onClick={() => !isDisabled && onChange(field.name, opt)}
                                        onKeyDown={(e) => {
                                            if ((e.key === " " || e.key === "Enter") && !isDisabled) {
                                                e.preventDefault();
                                                onChange(field.name, opt);
                                            }
                                        }}
                                        sx={{
                                            flex: "1 1 0",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 1,
                                            px: 2,
                                            py: 3,
                                            minHeight: 100,
                                            border: "2px solid",
                                            borderColor: isSelected ? "primary.main" : "divider",
                                            borderRadius: 2,
                                            backgroundColor: isSelected ? "primary.50" : "transparent",
                                            cursor: isDisabled ? "not-allowed" : "pointer",
                                            opacity: isDisabled ? 0.5 : 1,
                                            transition: "all 0.2s ease",
                                            userSelect: "none",
                                            "&:hover": isDisabled ? {} : {
                                                borderColor: "primary.main",
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                    >
                                        {meta?.imageUrl && (
                                            <Box
                                                component="img"
                                                src={meta.imageUrl}
                                                alt={opt}
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    objectFit: "contain",
                                                    borderRadius: 1,
                                                }}
                                            />
                                        )}
                                        <Typography
                                            variant={meta?.imageUrl ? "body2" : "body1"}
                                            fontWeight={isSelected ? 700 : 600}
                                            sx={{
                                                textAlign: "center",
                                                fontFamily: meta?.imageUrl ? undefined : '"Cinzel", serif',
                                                color: isSelected ? "primary.main" : "text.primary",
                                            }}
                                        >
                                            {opt}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                        <input type="hidden" name={htmlName} value={String(value)} />
                        {error && <FormHelperText error>{error}</FormHelperText>}
                    </Box>
                );
            }

            if (isBinary) {
                return (
                    <Box>
                        <Box
                            role="radiogroup"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Typography variant="body2">{label}</Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexShrink: 0,
                                }}
                            >
                                {options.map((opt) => {
                                    const isSelected = String(value) === opt;
                                    const isDisabled =
                                        disabledOptions?.has(opt) ?? false;
                                    return (
                                        <Box
                                            key={opt}
                                            role="radio"
                                            aria-checked={isSelected}
                                            tabIndex={0}
                                            onClick={() =>
                                                !isDisabled &&
                                                onChange(field.name, opt)
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    (e.key === " " ||
                                                        e.key === "Enter") &&
                                                    !isDisabled
                                                ) {
                                                    e.preventDefault();
                                                    onChange(field.name, opt);
                                                }
                                            }}
                                            sx={{
                                                px: 2.5,
                                                py: 0.75,
                                                borderRadius: 50,
                                                border: "2px solid",
                                                borderColor: isSelected
                                                    ? "primary.main"
                                                    : "divider",
                                                backgroundColor: isSelected
                                                    ? "primary.main"
                                                    : "transparent",
                                                color: isSelected
                                                    ? "primary.contrastText"
                                                    : "text.primary",
                                                cursor: isDisabled
                                                    ? "not-allowed"
                                                    : "pointer",
                                                opacity: isDisabled ? 0.5 : 1,
                                                fontWeight: isSelected
                                                    ? 700
                                                    : 400,
                                                fontSize: "0.875rem",
                                                transition: "all 0.2s ease",
                                                userSelect: "none",
                                                "&:hover": isDisabled
                                                    ? {}
                                                    : {
                                                          borderColor:
                                                              "primary.main",
                                                      },
                                            }}
                                        >
                                            {opt}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <input
                            type="hidden"
                            name={htmlName}
                            value={String(value)}
                        />
                        {error && (
                            <FormHelperText error>{error}</FormHelperText>
                        )}
                    </Box>
                );
            }

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
                        {options.map((opt) => {
                            const isDisabled =
                                disabledOptions?.has(opt) ?? false;
                            return (
                                <FormControlLabel
                                    key={opt}
                                    value={opt}
                                    control={<Radio />}
                                    label={
                                        isDisabled
                                            ? `${opt} (Kapacita vyčerpána)`
                                            : opt
                                    }
                                    disabled={isDisabled}
                                />
                            );
                        })}
                    </RadioGroup>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>
            );
        }

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
                <Box>
                    <DatePicker
                        label={label}
                        value={value ? dayjs(String(value)) : null}
                        onChange={(v) =>
                            onChange(field.name, v?.format("YYYY-MM-DD") ?? "")
                        }
                        format="DD.MM.YYYY"
                        slotProps={{
                            textField: {
                                error: !!error,
                                helperText: error,
                                fullWidth: true,
                            },
                        }}
                    />
                    <input
                        type="hidden"
                        name={htmlName}
                        value={String(value)}
                    />
                </Box>
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
            const def = pricingDefinitions?.find(
                (d) => d.id === field.pricingId
            );
            if (!def) return null;
            const defTiers = def.usePriceTiers ? (priceTiers ?? []) : [];
            const currentTier = getCurrentTierIndex(defTiers);
            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {label}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {def.options.map((opt) => {
                            const isSelected = String(value) === opt.name;
                            const isDisabled =
                                disabledOptions?.has(opt.name) ?? false;
                            const currentPrice =
                                opt.prices[currentTier] ??
                                opt.prices[opt.prices.length - 1] ??
                                0;
                            const priceTag = `${currentPrice > 0 ? "+" : ""}${formatPrice(currentPrice)}`;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() =>
                                        !isDisabled &&
                                        onChange(field.name, opt.name)
                                    }
                                    sx={{
                                        flex: { xs: "1 1 100%", sm: "1 1 0" },
                                        minWidth: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 1.5,
                                        px: 2,
                                        py: 1.5,
                                        border: "2px solid",
                                        borderColor: isDisabled
                                            ? "action.disabled"
                                            : isSelected
                                              ? "primary.main"
                                              : "divider",
                                        borderRadius: 1,
                                        backgroundColor: isDisabled
                                            ? "action.disabledBackground"
                                            : isSelected
                                              ? "primary.50"
                                              : "transparent",
                                        cursor: isDisabled
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: isDisabled ? 0.6 : 1,
                                        transition: "all 0.2s ease",
                                        "&:hover": isDisabled
                                            ? {}
                                            : {
                                                  borderColor: isSelected
                                                      ? "primary.main"
                                                      : "action.selected",
                                              },
                                    }}
                                >
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="body1"
                                            fontWeight={600}
                                            noWrap
                                        >
                                            {opt.name}
                                        </Typography>
                                        {opt.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                            >
                                                {opt.description}
                                            </Typography>
                                        )}
                                        {isDisabled && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    px: 1,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    backgroundColor:
                                                        "error.main",
                                                    color: "error.contrastText",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Kapacita vyčerpána
                                            </Typography>
                                        )}
                                    </Box>
                                    {priceTag && (
                                        <Typography
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: "1.25rem",
                                                color: "primary.main",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {priceTag}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                    {defTiers.length > 1 && (
                        <>
                            <Collapse in={showAllTiers}>
                                <Box sx={{ mt: 1, pl: 1 }}>
                                    {def.options.map((opt) => (
                                        <Box key={opt.id} sx={{ mb: 0.5 }}>
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                            >
                                                {opt.name}:
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 1,
                                                }}
                                            >
                                                {defTiers.map((tier, idx) => {
                                                    if (
                                                        idx === currentTier ||
                                                        opt.prices[idx] === 0
                                                    )
                                                        return null;
                                                    return (
                                                        <Typography
                                                            key={idx}
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            do{" "}
                                                            {formatDate(tier)}:{" "}
                                                            {formatPrice(
                                                                opt.prices[idx]
                                                            )}
                                                        </Typography>
                                                    );
                                                })}
                                                {currentTier !==
                                                    defTiers.length &&
                                                    opt.prices[
                                                        defTiers.length
                                                    ] !== 0 && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            na místě:{" "}
                                                            {formatPrice(
                                                                opt.prices[
                                                                    defTiers
                                                                        .length
                                                                ]
                                                            )}
                                                        </Typography>
                                                    )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Collapse>
                            <Typography
                                variant="body2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllTiers((prev) => !prev);
                                }}
                                sx={{
                                    cursor: "pointer",
                                    color: "primary.main",
                                    mt: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                {showAllTiers
                                    ? "Skrýt ostatní ceny"
                                    : "Zobrazit všechny ceny"}
                                <ExpandMore
                                    sx={{
                                        transform: showAllTiers
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        fontSize: 18,
                                    }}
                                />
                            </Typography>
                        </>
                    )}
                    <input
                        type="hidden"
                        name={htmlName}
                        value={String(value)}
                    />
                    {error && <FormHelperText error>{error}</FormHelperText>}
                </Box>
            );
        }

        case "pricing_quantity": {
            const def = pricingDefinitions?.find(
                (d) => d.id === field.pricingId
            );
            if (!def) return null;
            const unitOpt = def.options[0];
            if (!unitOpt) return null;
            const defTiersQ = def.usePriceTiers ? (priceTiers ?? []) : [];
            const currentTier = getCurrentTierIndex(defTiersQ);
            const unitPrice = unitOpt.prices[currentTier] ?? 0;
            const qty = Number(value) || 0;
            const totalPrice = qty * unitPrice;
            const currentLabelQ =
                currentTier < defTiersQ.length
                    ? `do ${formatDate(defTiersQ[currentTier])}`
                    : defTiersQ.length > 0
                      ? "na místě"
                      : "";
            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {label}
                    </Typography>
                    {unitOpt.description && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            {unitOpt.description}
                        </Typography>
                    )}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 1,
                        }}
                    >
                        <TextField
                            name={htmlName}
                            type="number"
                            value={String(qty)}
                            onChange={(e) =>
                                onChange(
                                    field.name,
                                    Math.max(
                                        0,
                                        Math.floor(Number(e.target.value) || 0)
                                    )
                                )
                            }
                            error={!!error}
                            helperText={error}
                            inputProps={{ min: 0, step: 1 }}
                            size="small"
                            sx={{ width: 120 }}
                        />
                        {def.unitName && (
                            <Typography variant="body2" color="text.secondary">
                                {def.unitName}
                            </Typography>
                        )}
                    </Box>
                    {unitPrice !== 0 && (
                        <Typography
                            variant="body1"
                            sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                            {currentLabelQ
                                ? `Cena za ${def.unitName || "jednotku"} (${currentLabelQ}): `
                                : `Cena za ${def.unitName || "jednotku"}: `}
                            {formatPrice(unitPrice)}
                        </Typography>
                    )}
                    {defTiersQ.length > 1 && (
                        <>
                            <Collapse in={showAllTiers}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 0.25,
                                        mt: 0.5,
                                    }}
                                >
                                    {defTiersQ.map((tier, idx) => {
                                        if (
                                            idx === currentTier ||
                                            unitOpt.prices[idx] === 0
                                        )
                                            return null;
                                        return (
                                            <Typography
                                                key={idx}
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                do {formatDate(tier)}:{" "}
                                                {formatPrice(
                                                    unitOpt.prices[idx]
                                                )}
                                            </Typography>
                                        );
                                    })}
                                    {currentTier !== defTiersQ.length &&
                                        unitOpt.prices[defTiersQ.length] !==
                                            0 && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {defTiersQ.length > 0
                                                    ? "na místě: "
                                                    : ""}
                                                {formatPrice(
                                                    unitOpt.prices[
                                                        defTiersQ.length
                                                    ]
                                                )}
                                            </Typography>
                                        )}
                                </Box>
                            </Collapse>
                            <Typography
                                variant="body2"
                                onClick={() => setShowAllTiers((prev) => !prev)}
                                sx={{
                                    cursor: "pointer",
                                    color: "primary.main",
                                    mt: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                {showAllTiers
                                    ? "Skrýt ostatní ceny"
                                    : "Zobrazit všechny ceny"}
                                <ExpandMore
                                    sx={{
                                        transform: showAllTiers
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        fontSize: 18,
                                    }}
                                />
                            </Typography>
                        </>
                    )}
                    {qty > 0 && unitPrice !== 0 && (
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ mt: 1, color: "primary.main" }}
                        >
                            {qty} x {formatPrice(unitPrice)} ={" "}
                            {formatPrice(totalPrice)}
                        </Typography>
                    )}
                </Box>
            );
        }

        case "pricing_multi_select": {
            const msDef = pricingDefinitions?.find(
                (d) => d.id === field.pricingId
            );
            if (!msDef) return null;
            const msDefTiers = msDef.usePriceTiers ? (priceTiers ?? []) : [];
            const msCurrentTier = getCurrentTierIndex(msDefTiers);
            let msSelected: string[] = [];
            try {
                const parsed = JSON.parse(String(value || "[]"));
                if (Array.isArray(parsed)) msSelected = parsed;
            } catch {
                /* empty */
            }

            const handleToggleOption = (optName: string) => {
                const newSelected = msSelected.includes(optName)
                    ? msSelected.filter((n) => n !== optName)
                    : [...msSelected, optName];
                onChange(field.name, JSON.stringify(newSelected));
            };

            return (
                <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {label}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {msDef.options.map((opt) => {
                            const isSelected = msSelected.includes(opt.name);
                            const isDisabled =
                                disabledOptions?.has(opt.name) ?? false;
                            const msCurrentPrice =
                                opt.prices[msCurrentTier] ??
                                opt.prices[opt.prices.length - 1] ??
                                0;
                            const msPriceTag = `${msCurrentPrice > 0 ? "+" : "-"}${formatPrice(msCurrentPrice)}`;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() =>
                                        !isDisabled &&
                                        handleToggleOption(opt.name)
                                    }
                                    sx={{
                                        flex: { xs: "1 1 100%", sm: "1 1 0" },
                                        minWidth: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 1.5,
                                        px: 2,
                                        py: 1.5,
                                        border: "2px solid",
                                        borderColor: isDisabled
                                            ? "action.disabled"
                                            : isSelected
                                              ? "secondary.main"
                                              : "divider",
                                        borderRadius: 1,
                                        backgroundColor: isDisabled
                                            ? "action.disabledBackground"
                                            : isSelected
                                              ? "secondary.50"
                                              : "transparent",
                                        cursor: isDisabled
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: isDisabled ? 0.6 : 1,
                                        transition: "all 0.2s ease",
                                        "&:hover": isDisabled
                                            ? {}
                                            : {
                                                  borderColor: isSelected
                                                      ? "secondary.main"
                                                      : "action.selected",
                                              },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 0.5,
                                                border: "2px solid",
                                                borderColor: isSelected
                                                    ? "secondary.main"
                                                    : "action.disabled",
                                                backgroundColor: isSelected
                                                    ? "secondary.main"
                                                    : "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                color: "white",
                                                fontSize: 14,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {isSelected && "✓"}
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography
                                                variant="body1"
                                                fontWeight={600}
                                                noWrap
                                            >
                                                {opt.name}
                                            </Typography>
                                            {opt.description && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    noWrap
                                                >
                                                    {opt.description}
                                                </Typography>
                                            )}
                                            {isDisabled && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 1,
                                                        backgroundColor:
                                                            "error.main",
                                                        color: "error.contrastText",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Kapacita vyčerpána
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    {msPriceTag && (
                                        <Typography
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: "1.25rem",
                                                color: "primary.main",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {msPriceTag}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                    {msDefTiers.length > 1 && (
                        <>
                            <Collapse in={showAllTiers}>
                                <Box sx={{ mt: 1, pl: 1 }}>
                                    {msDef.options.map((opt) => (
                                        <Box key={opt.id} sx={{ mb: 0.5 }}>
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                            >
                                                {opt.name}:
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 1,
                                                }}
                                            >
                                                {msDefTiers.map((tier, idx) => {
                                                    if (
                                                        idx === msCurrentTier ||
                                                        opt.prices[idx] === 0
                                                    )
                                                        return null;
                                                    return (
                                                        <Typography
                                                            key={idx}
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            do{" "}
                                                            {formatDate(tier)}:{" "}
                                                            {formatPrice(
                                                                opt.prices[idx]
                                                            )}
                                                        </Typography>
                                                    );
                                                })}
                                                {msCurrentTier !==
                                                    msDefTiers.length &&
                                                    opt.prices[
                                                        msDefTiers.length
                                                    ] !== 0 && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            na místě:{" "}
                                                            {formatPrice(
                                                                opt.prices[
                                                                    msDefTiers
                                                                        .length
                                                                ]
                                                            )}
                                                        </Typography>
                                                    )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Collapse>
                            <Typography
                                variant="body2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllTiers((prev) => !prev);
                                }}
                                sx={{
                                    cursor: "pointer",
                                    color: "primary.main",
                                    mt: 0.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                {showAllTiers
                                    ? "Skrýt ostatní ceny"
                                    : "Zobrazit všechny ceny"}
                                <ExpandMore
                                    sx={{
                                        transform: showAllTiers
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        fontSize: 18,
                                    }}
                                />
                            </Typography>
                        </>
                    )}
                    <input
                        type="hidden"
                        name={htmlName}
                        value={String(value)}
                    />
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
