"use client";

import { Box, Typography } from "@mui/material";
import { builderPalette as p } from "./palette";

export function PanelLabel({ children }: { children: React.ReactNode }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Typography
                sx={{
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: p.ink3,
                    fontWeight: 700,
                }}
            >
                {children}
            </Typography>
            <Box sx={{ flex: 1, height: 1, backgroundColor: p.lineSoft }} />
        </Box>
    );
}
