"use client";

import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import type { FormField } from "@/lib/types/registration-form";
import { isInputField, FIELD_TYPE_META } from "@/lib/types/registration-form";

interface FieldListItemProps {
    field: FormField;
    onEdit: () => void;
    onDelete: () => void;
}

export function FieldListItem({ field, onEdit, onDelete }: FieldListItemProps) {
    const meta = FIELD_TYPE_META[field.type];
    const isInput = isInputField(field);

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                minHeight: 48,
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" noWrap fontWeight={500}>
                        {isInput ? field.label : field.text}
                    </Typography>
                    <Chip
                        label={meta.label}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                    {isInput && field.required && (
                        <Chip
                            label="Povinné"
                            size="small"
                            color="error"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                    )}
                    {isInput && field.condition && (
                        <Chip
                            label="Podmíněné"
                            size="small"
                            color="info"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                    )}
                </Box>
                {isInput && (
                    <Typography variant="caption" color="text.secondary">
                        {field.name}
                    </Typography>
                )}
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
