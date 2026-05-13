"use client";

import { IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GameIcon } from "@/lib/icons";
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
                        backgroundColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.15),
                        transform: "rotate(180deg)",
                    },
                }}
                aria-label={isDark ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
            >
                {isDark ? <GameIcon name="sun" /> : <GameIcon name="moon" />}
            </IconButton>
        </Tooltip>
    );
}
