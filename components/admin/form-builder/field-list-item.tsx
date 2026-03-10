"use client";

import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import { Edit, Delete, AddCircleOutline, People } from "@mui/icons-material";
import type { FormField, InputField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField, FIELD_TYPE_META } from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";

interface FieldListItemProps {
    field: FormField;
    onEdit: () => void;
    onDelete: () => void;
    onToggleField?: (fieldId: string, updates: Partial<InputField>) => void;
    usedInCondition?: boolean;
    pricingDefinitions?: PricingDefinition[];
    onCreateCondition?: (fieldId: string, fieldLabel: string, optionValue: string) => void;
}

export function FieldListItem({ field, onEdit, onDelete, onToggleField, usedInCondition, pricingDefinitions, onCreateCondition }: FieldListItemProps) {
    const meta = FIELD_TYPE_META[field.type];
    const isInput = isInputField(field);

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1.5,
                minHeight: 56,
            }}
        >
            <Box sx={{ color: "text.secondary", display: "flex" }}>
                {FIELD_TYPE_ICONS[meta.icon]}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        fontSize: "0.6rem",
                        lineHeight: 1,
                        mb: 0.25,
                        display: "block",
                    }}
                >
                    {meta.label}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" noWrap fontWeight={500}>
                        {isInput ? field.label : field.text}
                    </Typography>
                    {usedInCondition && (
                        <Chip
                            label="Podmínka"
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                    )}
                </Box>
                {isInput && (field.type === "select" || field.type === "radio") && field.options && field.options.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                        {field.options.map((opt, idx) => (
                            <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                    {opt || `Možnost ${idx + 1}`}
                                </Typography>
                                {onCreateCondition && opt && (
                                    <Tooltip title="Vytvořit podmínku">
                                        <IconButton
                                            size="small"
                                            sx={{ p: 0, ml: 0.5, minWidth: 0, minHeight: 0, lineHeight: 1 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCreateCondition(field.id, field.label, opt);
                                            }}
                                        >
                                            <AddCircleOutline sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
                {isInput && field.type === "pricing_select" && field.pricingId && pricingDefinitions && (() => {
                    const def = pricingDefinitions.find((d) => d.id === field.pricingId);
                    return def ? (
                        <Typography variant="caption" color="text.secondary">
                            Ceník: {def.name}
                        </Typography>
                    ) : null;
                })()}
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                {isInput && onToggleField && (
                    <>
                        <Tooltip title={field.required ? "Zrušit povinné" : "Nastavit jako povinné"}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleField(field.id, { required: !field.required });
                                }}
                                sx={{
                                    border: 1,
                                    borderColor: field.required ? "error.main" : "grey.400",
                                    color: field.required ? "error.main" : "grey.400",
                                    borderRadius: 1,
                                    width: 28,
                                    height: 28,
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    "&:hover": {
                                        borderColor: "error.main",
                                        color: "error.main",
                                        backgroundColor: "error.50",
                                    },
                                }}
                            >
                                *
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={field.includeForAdditionalPeople ? "Zrušit pro další osoby" : "Zobrazit pro další osoby"}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleField(field.id, {
                                        includeForAdditionalPeople: !field.includeForAdditionalPeople || undefined,
                                    });
                                }}
                                sx={{
                                    border: 1,
                                    borderColor: field.includeForAdditionalPeople ? "warning.main" : "grey.400",
                                    color: field.includeForAdditionalPeople ? "warning.main" : "grey.400",
                                    borderRadius: 1,
                                    width: 28,
                                    height: 28,
                                    "&:hover": {
                                        borderColor: "warning.main",
                                        color: "warning.main",
                                        backgroundColor: "warning.50",
                                    },
                                }}
                            >
                                <People sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
                <Tooltip title="Upravit">
                    <IconButton size="small" onClick={onEdit}>
                        <Edit fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Smazat">
                    <IconButton size="small" onClick={onDelete} color="error">
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}
