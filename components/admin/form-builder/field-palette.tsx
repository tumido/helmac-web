"use client";

import { Box, Typography, Paper } from "@mui/material";
import {
    AccountTree,
    Sell,
    Calculate,
    PlaylistAddCheck,
    InfoOutlined,
} from "@mui/icons-material";
import { useDraggable } from "@dnd-kit/core";
import { FieldType, FIELD_TYPE_META } from "@/lib/types/registration-form";
import type {
    FormCondition,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";

interface DraggablePaletteItemProps {
    type: FieldType;
    label: string;
    icon: React.ReactNode;
    compact?: boolean;
    onAdd?: (type: FieldType) => void;
}

function DraggablePaletteItem({
    type,
    label,
    icon,
    compact,
    onAdd,
}: DraggablePaletteItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: { type },
    });

    if (compact) {
        return (
            <Paper
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                onClick={() => onAdd?.(type)}
                variant="outlined"
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    p: 1,
                    cursor: "pointer",
                    opacity: isDragging ? 0.5 : 1,
                    minHeight: 64,
                    "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                    },
                    "&:active": {
                        cursor: "grabbing",
                    },
                }}
            >
                <Box sx={{ color: "primary.main", display: "flex" }}>
                    {icon}
                </Box>
                <Typography
                    variant="caption"
                    sx={{ fontSize: "0.65rem", textAlign: "center" }}
                >
                    {label}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            onClick={() => onAdd?.(type)}
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "pointer",
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

interface DraggableConditionItemProps {
    condition: FormCondition;
    onAdd?: (conditionId: string) => void;
}

function DraggableConditionItem({
    condition,
    onAdd,
}: DraggableConditionItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-condition-${condition.id}`,
        data: { type: "condition", conditionId: condition.id },
    });

    return (
        <Paper
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            onClick={() => onAdd?.(condition.id)}
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "pointer",
                opacity: isDragging ? 0.5 : 1,
                borderColor: "info.main",
                "&:hover": {
                    borderColor: "info.dark",
                    backgroundColor: "action.hover",
                },
                "&:active": {
                    cursor: "grabbing",
                },
            }}
        >
            <Box sx={{ color: "info.main", display: "flex" }}>
                <AccountTree fontSize="small" />
            </Box>
            <Typography variant="body2" noWrap>
                {condition.name || "(nepojmenovaná)"}
            </Typography>
        </Paper>
    );
}

interface DraggablePricingItemProps {
    definition: PricingDefinition;
    onAdd?: (definitionId: string) => void;
}

function DraggablePricingItem({
    definition,
    onAdd,
}: DraggablePricingItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-pricing-${definition.id}`,
        data: { type: "pricing", definitionId: definition.id },
    });

    const isQuantity = definition.type === "quantity";
    const isMultiSelect = !isQuantity && definition.multiSelect;
    const color = isQuantity ? "info" : isMultiSelect ? "secondary" : "success";

    return (
        <Paper
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            onClick={() => onAdd?.(definition.id)}
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "pointer",
                opacity: isDragging ? 0.5 : 1,
                borderColor: `${color}.main`,
                "&:hover": {
                    borderColor: `${color}.dark`,
                    backgroundColor: "action.hover",
                },
                "&:active": {
                    cursor: "grabbing",
                },
            }}
        >
            <Box sx={{ color: `${color}.main`, display: "flex" }}>
                {isQuantity ? (
                    <Calculate fontSize="small" />
                ) : isMultiSelect ? (
                    <PlaylistAddCheck fontSize="small" />
                ) : (
                    <Sell fontSize="small" />
                )}
            </Box>
            <Typography variant="body2" noWrap>
                {definition.name || "(nepojmenovaná)"}
            </Typography>
        </Paper>
    );
}

interface FieldPaletteProps {
    conditions?: FormCondition[];
    pricingDefinitions?: PricingDefinition[];
    onAddField?: (type: FieldType) => void;
    onAddConditionBlock?: (conditionId: string) => void;
    onAddPricingField?: (definitionId: string) => void;
}

export function FieldPalette({
    conditions = [],
    pricingDefinitions = [],
    onAddField,
    onAddConditionBlock,
    onAddPricingField,
}: FieldPaletteProps) {
    const inputTypes = Object.entries(FIELD_TYPE_META).filter(
        ([, meta]) => meta.group === "input"
    );
    const layoutTypes = Object.entries(FIELD_TYPE_META).filter(
        ([, meta]) => meta.group === "layout"
    );

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                position: "sticky",
                top: 16,
            }}
        >
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
            >
                Vstupní pole
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                    mb: 2,
                }}
            >
                {inputTypes.map(([type, meta]) => (
                    <DraggablePaletteItem
                        key={type}
                        type={type as FieldType}
                        label={meta.label}
                        icon={FIELD_TYPE_ICONS[meta.icon]}
                        compact
                        onAdd={onAddField}
                    />
                ))}
            </Box>

            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
            >
                Rozložení
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    mb: 2,
                }}
            >
                {layoutTypes.map(([type, meta]) => (
                    <DraggablePaletteItem
                        key={type}
                        type={type as FieldType}
                        label={meta.label}
                        icon={FIELD_TYPE_ICONS[meta.icon]}
                        onAdd={onAddField}
                    />
                ))}
            </Box>

            {conditions.length > 0 && (
                <>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                    >
                        Podmínky
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.75,
                            mb: 2,
                        }}
                    >
                        {conditions.map((condition) => (
                            <DraggableConditionItem
                                key={condition.id}
                                condition={condition}
                                onAdd={onAddConditionBlock}
                            />
                        ))}
                    </Box>
                </>
            )}

            {pricingDefinitions.length > 0 && (
                <>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                    >
                        Ceník
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.75,
                            mb: 2,
                        }}
                    >
                        {pricingDefinitions.map((def) => (
                            <DraggablePricingItem
                                key={def.id}
                                definition={def}
                                onAdd={onAddPricingField}
                            />
                        ))}
                    </Box>
                </>
            )}

            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: "info.50",
                    bgcolor: (theme) =>
                        theme.palette.mode === "light"
                            ? "rgba(2, 136, 209, 0.08)"
                            : "rgba(2, 136, 209, 0.15)",
                }}
            >
                <InfoOutlined
                    sx={{ fontSize: 16, color: "info.main", mt: 0.25 }}
                />
                <Typography variant="caption" color="text.secondary">
                    Klikněte na pole pro přidání na konec, nebo přetáhněte na
                    konkrétní místo.
                </Typography>
            </Box>
        </Paper>
    );
}
