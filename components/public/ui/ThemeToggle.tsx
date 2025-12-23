"use client";

import { IconButton, Tooltip } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import { useThemeMode } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
    size?: "small" | "medium" | "large";
}

export function ThemeToggle({ size = "medium" }: ThemeToggleProps) {
    const { mode, toggleTheme, isDark } = useThemeMode();

    return (
        <Tooltip title={isDark ? "Prepnout na svetly rezim" : "Prepnout na tmavy rezim"}>
            <IconButton
                onClick={toggleTheme}
                size={size}
                sx={{
                    color: "primary.main",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                        backgroundColor: "rgba(201, 162, 39, 0.15)",
                        transform: "rotate(180deg)",
                    },
                }}
                aria-label={isDark ? "Prepnout na svetly rezim" : "Prepnout na tmavy rezim"}
            >
                {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>
        </Tooltip>
    );
}
