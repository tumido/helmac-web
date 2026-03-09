"use client";

import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import type { FormField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField, FIELD_TYPE_META } from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";

interface FieldListItemProps {
    field: FormField;
    onEdit: () => void;
    onDelete: () => void;
    usedInCondition?: boolean;
    pricingDefinitions?: PricingDefinition[];
}

export function FieldListItem({ field, onEdit, onDelete, usedInCondition, pricingDefinitions }: FieldListItemProps) {
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
                    {isInput && field.required && (
                        <Chip
                            label="Povinné"
                            size="small"
                            color="error"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                    )}
                    {isInput && field.includeForAdditionalPeople && (
                        <Chip
                            label="Další osoby"
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                    )}
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
