"use client";

import { Box, Container, Typography, useTheme } from "@mui/material";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
}

export function PageHeader({ title, subtitle, backgroundImage }: PageHeaderProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box
            sx={{
                position: "relative",
                color: "common.white",
                py: { xs: 6, md: 8 },
                backgroundImage: `url(${backgroundImage || "/images/battle-bg.png"})`,
                backgroundSize: "cover",
                backgroundPosition: "center 55%",
                backgroundRepeat: "no-repeat",
                mb: 3,
            }}
        >
            {/* Dark overlay */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isDark ? "rgba(26, 26, 26, 0.75)" : "rgba(245, 242, 235, 0.65)",
                    zIndex: 0,
                }}
            />
            {/* Bottom gradient fade */}
            <Box
                sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "50%",
                    background: isDark
                        ? "linear-gradient(to bottom, transparent 0%, #1A1A1A 100%)"
                        : "linear-gradient(to bottom, transparent 0%, #F5F2EB 100%)",
                    zIndex: 0,
                }}
            />
            <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        color: isDark ? "common.white" : "primary.dark",
                        fontSize: { xs: "2rem", md: "3rem" },
                        textAlign: "center",
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body1"
                        sx={{
                            textAlign: "center",
                            mt: 2,
                            opacity: 0.9,
                            maxWidth: 600,
                            mx: "auto",
                            color: isDark ? "common.white" : "text.primary",
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Container>
        </Box>
    );
}
