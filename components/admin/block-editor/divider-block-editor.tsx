"use client";

import {
    Box,
    ToggleButton,
    ToggleButtonGroup,
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
                height: "100%",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "action.hover",
                    flexShrink: 0,
                }}
            >
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={block.variant}
                    onChange={(_, v) => {
                        if (v) onChange({ ...block, variant: v });
                    }}
                    sx={{
                        "& .MuiToggleButton-root": {
                            py: 0.25,
                            px: 1,
                            textTransform: "none",
                        },
                    }}
                >
                    {VARIANTS.map(({ value, label }) => (
                        <ToggleButton key={value} value={value}>
                            <Typography variant="caption">
                                {label}
                            </Typography>
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    minHeight: 60,
                }}
            >
                <Box sx={{ width: "100%" }}>
                    <DecorativeDivider
                        variant={block.variant}
                        my={0}
                    />
                </Box>
            </Box>
        </Box>
    );
}
