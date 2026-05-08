"use client";

import {
    Box,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import { DecorativeDivider } from "@/components/public/ui/Divider";
import type { DividerBlock, DividerVariant } from "@/lib/types/content-blocks";

const VARIANTS: { value: DividerVariant; label: string }[] = [
    { value: "simple", label: "Jednoduchý" },
    { value: "ornate", label: "Ozdobný" },
];

interface DividerBlockEditorProps {
    block: DividerBlock;
    onChange: (block: DividerBlock) => void;
}

export function DividerBlockEditor({
    block,
    onChange,
}: DividerBlockEditorProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                gap: 1,
            }}
        >
            <Box sx={{ width: "100%", flex: 1, display: "flex", alignItems: "center" }}>
                <Box sx={{ width: "100%" }}>
                    <DecorativeDivider variant={block.variant} my={0} />
                </Box>
            </Box>
            <ToggleButtonGroup
                size="small"
                exclusive
                value={block.variant}
                onChange={(_, v) => {
                    if (v) onChange({ ...block, variant: v });
                }}
                sx={{ flexShrink: 0 }}
            >
                {VARIANTS.map(({ value, label }) => (
                    <ToggleButton key={value} value={value}>
                        <Tooltip title={label}>
                            <Typography variant="caption" sx={{ px: 0.5 }}>
                                {label}
                            </Typography>
                        </Tooltip>
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
}
