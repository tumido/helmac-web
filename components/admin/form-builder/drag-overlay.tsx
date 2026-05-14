"use client";

import { Box, Paper, Typography } from "@mui/material";
import {
    FIELD_TYPE_META,
    type FieldType,
    type FormCondition,
    type PricingDefinition,
} from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";
import { findFlatFieldById } from "./form-builder-helpers";
import type { FlatElement } from "./form-data-adapter";

interface Props {
    activeId: string | null;
    elements: FlatElement[];
    conditions: FormCondition[];
    pricingDefinitions: PricingDefinition[];
}

export function DragOverlayContent({
    activeId,
    elements,
    conditions,
    pricingDefinitions,
}: Props) {
    if (!activeId) return null;

    if (activeId.startsWith("palette-pricing-")) {
        const def = pricingDefinitions.find(
            (d) => d.id === activeId.slice("palette-pricing-".length)
        );
        const isQuantity = def?.type === "quantity";
        const isMulti = !isQuantity && def?.multiSelect;
        const color = isQuantity ? "info" : isMulti ? "primary" : "success";
        const icon = isQuantity
            ? "Calculate"
            : isMulti
              ? "PlaylistAddCheck"
              : "Sell";
        return <PaletteChip color={color} icon={icon} label={def?.name ?? "Ceník"} />;
    }

    if (activeId.startsWith("palette-condition-")) {
        const cond = conditions.find(
            (c) => c.id === activeId.slice("palette-condition-".length)
        );
        return (
            <PaletteChip
                color="info"
                icon="AccountTree"
                label={cond?.name ?? "Podmínka"}
            />
        );
    }

    if (activeId.startsWith("palette-")) {
        const type = activeId.slice("palette-".length) as FieldType;
        const meta = FIELD_TYPE_META[type];
        return <PaletteChip color="primary" icon={meta.icon} label={meta.label} />;
    }

    const field = findFlatFieldById(elements, activeId);
    if (field) {
        const meta = FIELD_TYPE_META[field.type];
        return (
            <Paper elevation={4} sx={{ p: 1.5 }}>
                <Typography variant="body2" fontWeight={500}>
                    {meta.label}: {"label" in field ? field.label : field.text}
                </Typography>
            </Paper>
        );
    }

    const block = elements.find(
        (el) => el.kind === "block" && el.data.id === activeId
    );
    if (block && block.kind === "block") {
        const cond = conditions.find((c) => c.id === block.data.conditionId);
        return (
            <Paper
                elevation={4}
                sx={{
                    p: 1.5,
                    borderLeft: "4px solid",
                    borderLeftColor: "info.main",
                }}
            >
                <Typography variant="body2" fontWeight={500}>
                    Podmínka: {cond?.name ?? "(nepojmenovaná)"}
                </Typography>
            </Paper>
        );
    }

    return null;
}

function PaletteChip({
    color,
    icon,
    label,
}: {
    color: string;
    icon: string;
    label: string;
}) {
    return (
        <Paper
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                backgroundColor: "background.paper",
                borderColor: `${color}.main`,
                width: 200,
            }}
        >
            <Box sx={{ color: `${color}.main`, display: "flex" }}>
                {FIELD_TYPE_ICONS[icon]}
            </Box>
            <Typography variant="body2">{label}</Typography>
        </Paper>
    );
}
