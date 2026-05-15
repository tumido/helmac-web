import type { ReactNode } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { GameIcon } from "@/lib/icons";

interface ParchmentCalloutProps {
    children: ReactNode;
    icon?: string;
    sx?: SxProps<Theme>;
}

export function ParchmentCallout({
    children,
    icon = "scroll-unfurled",
    sx,
}: ParchmentCalloutProps) {
    return (
        <Box
            sx={{
                backgroundColor: "rgba(201, 162, 39, 0.04)",
                border: "1px solid",
                borderColor: "rgba(201, 162, 39, 0.15)",
                borderRadius: 2,
                p: { xs: 2, md: 2.5 },
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                ...sx,
            }}
        >
            <GameIcon
                name={icon}
                sx={{
                    color: "primary.main",
                    fontSize: "1.5rem",
                    mt: 0.25,
                    flexShrink: 0,
                }}
            />
            <Box sx={{ minWidth: 0 }}>{children}</Box>
        </Box>
    );
}
