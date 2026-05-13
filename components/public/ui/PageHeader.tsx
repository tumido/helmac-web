"use client";

import { Box, Container, Typography, useTheme } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string;
    backgroundImage?: string;
    children?: ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    icon = "knight-banner",
    backgroundImage = "/images/battle-bg.png",
    children,
}: PageHeaderProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box
            sx={{
                position: "relative",
                pt: { xs: 10, md: 14 },
                pb: { xs: 2, md: 2 },
                mb: children ? -2 : 1,
                overflow: "clip",
                overflowX: "clip",
                overflowY: "visible",
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "100% auto",
                backgroundPosition: "center 55%",
                backgroundRepeat: "no-repeat",
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isDark
                        ? "linear-gradient(to bottom, rgba(13, 13, 13, 0.5) 0%, rgba(13, 13, 13, 0.8) 40%, #0D0D0D 75%)"
                        : "linear-gradient(to bottom, rgba(245, 242, 235, 0.45) 0%, rgba(245, 242, 235, 0.8) 40%, #F5F2EB 75%)",
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isDark
                        ? "linear-gradient(to bottom, rgba(201, 162, 39, 0.06) 0%, transparent 70%)"
                        : "linear-gradient(to bottom, rgba(201, 162, 39, 0.08) 0%, transparent 70%)",
                    zIndex: 0,
                }}
            />
            <Container
                maxWidth="lg"
                sx={{ position: "relative", zIndex: 1 }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: { xs: 2, md: 3 },
                    }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            flexShrink: 0,
                            width: { xs: 130, md: 200 },
                            alignSelf: "flex-start",
                            height: { xs: 80, md: 120 },
                            ml: { xs: -2, md: -3 },
                        }}
                    >
                        <GameIcon
                            name={icon}
                            sx={{
                                position: "absolute",
                                top: "50%",
                                left: 0,
                                transform: "translateY(-50%)",
                                fontSize: {
                                    xs: "8rem",
                                    md: "11rem",
                                },
                                color: "primary.main",
                                opacity: 0.6,
                                maskImage:
                                    "linear-gradient(to right, transparent 0%, black 50%)",
                                WebkitMaskImage:
                                    "linear-gradient(to right, transparent 0%, black 50%)",
                                pointerEvents: "none",
                            }}
                        />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h1"
                            component="h1"
                            sx={{
                                fontSize: {
                                    xs: "2rem",
                                    md: "3rem",
                                },
                                "&::first-letter": {
                                    fontSize: "1.3em",
                                },
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="h5"
                                component="p"
                                color="text.secondary"
                                sx={{
                                    mt: 0.5,
                                    fontFamily:
                                        '"Cinzel", serif',
                                    fontWeight: 600,
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    "&::first-letter": {
                                        fontSize: "1.3em",
                                    },
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                        {children && (
                            <Box sx={{ mt: 2 }}>
                                {children}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
