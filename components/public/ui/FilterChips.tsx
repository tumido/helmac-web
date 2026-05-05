"use client";

import { ReactElement } from "react";
import { Box, Chip, SxProps, Theme, useTheme } from "@mui/material";

export interface FilterChipItem {
    key: string;
    label: string;
    icon?: ReactElement;
}

interface FilterChipsProps {
    items: FilterChipItem[];
    selectedKey: string | null;
    onSelect: (key: string | null) => void;
    sx?: SxProps<Theme>;
}

export function FilterChips({
    items,
    selectedKey,
    onSelect,
    sx,
}: FilterChipsProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const chipStyles = (selected: boolean) => ({
        borderRadius: "50px",
        height: { xs: 34, sm: 40 },
        px: 1,
        fontSize: { xs: "0.8rem", sm: "0.95rem" },
        fontWeight: selected ? 700 : 500,
        border: "2px solid",
        borderColor: selected
            ? "primary.main"
            : isDark
              ? "rgba(255, 255, 255, 0.25)"
              : "rgba(45, 42, 38, 0.25)",
        backgroundColor: selected ? "primary.main" : "transparent",
        color: selected ? "primary.contrastText" : "text.primary",
        transition: "all 0.2s ease-in-out",
        "& .MuiChip-icon": {
            color: selected ? "primary.contrastText" : "primary.main",
            marginLeft: "8px",
            fontSize: "1.2rem",
        },
        "& .MuiChip-label": {
            px: 1.5,
        },
        "&:hover": {
            backgroundColor: selected
                ? "primary.dark"
                : "rgba(201, 162, 39, 0.15)",
            borderColor: selected
                ? "primary.dark"
                : "rgba(201, 162, 39, 0.5)",
        },
    });

    return (
        <Box
            sx={{
                display: "flex",
                gap: { xs: 1, sm: 1.5 },
                flexWrap: "wrap",
                overflowX: "auto",
                "&::-webkit-scrollbar": {
                    height: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: isDark
                        ? "rgba(201, 162, 39, 0.3)"
                        : "rgba(154, 123, 26, 0.4)",
                    borderRadius: 2,
                },
                ...((sx ?? {}) as Record<string, unknown>),
            }}
        >
            {items.map((item) => (
                <Chip
                    key={item.key}
                    data-key={item.key}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => onSelect(item.key)}
                    sx={chipStyles(selectedKey === item.key)}
                />
            ))}
        </Box>
    );
}
