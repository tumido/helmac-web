"use client";

import { IconButton, Tooltip } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import { useThemeMode } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
    size?: "small" | "medium" | "large";
}

export function ThemeToggle({ size = "medium" }: ThemeToggleProps) {
    const { toggleTheme, isDark } = useThemeMode();

    return (
        <Tooltip title={isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}>
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
                aria-label={isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
            >
                {isDark ? <LightMode /> : <DarkMode />}
            </IconButton>
        </Tooltip>
    );
}
