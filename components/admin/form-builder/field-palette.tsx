"use client";

import { Box, Typography, Paper } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { FieldType, FIELD_TYPE_META } from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";

interface DraggablePaletteItemProps {
    type: FieldType;
    label: string;
    icon: React.ReactNode;
}

function DraggablePaletteItem({ type, label, icon }: DraggablePaletteItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: { type },
    });

    return (
        <Paper
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "grab",
                opacity: isDragging ? 0.5 : 1,
                "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "action.hover",
                },
                "&:active": {
                    cursor: "grabbing",
                },
            }}
        >
            <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
            <Typography variant="body2">{label}</Typography>
        </Paper>
    );
}

export function FieldPalette() {
    const inputTypes = Object.entries(FIELD_TYPE_META).filter(([, meta]) => meta.group === "input");
    const layoutTypes = Object.entries(FIELD_TYPE_META).filter(([, meta]) => meta.group === "layout");

    return (
        <Box sx={{ position: "sticky", top: 16 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Vstupní pole
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 2 }}>
                {inputTypes.map(([type, meta]) => (
                    <DraggablePaletteItem
                        key={type}
                        type={type as FieldType}
                        label={meta.label}
                        icon={FIELD_TYPE_ICONS[meta.icon]}
                    />
                ))}
            </Box>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Rozložení
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {layoutTypes.map(([type, meta]) => (
                    <DraggablePaletteItem
                        key={type}
                        type={type as FieldType}
                        label={meta.label}
                        icon={FIELD_TYPE_ICONS[meta.icon]}
                    />
                ))}
            </Box>
        </Box>
    );
}
