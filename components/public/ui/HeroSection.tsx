"use client";

import { Box, Container, Typography, useTheme, keyframes } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LinkButton } from "@/components/ui/link-button";
import { ReactNode } from "react";
import { OrnamentalUnderline } from "./OrnamentalUnderline";
import { KeyboardArrowDown } from "@mui/icons-material";

const bounce = keyframes`
    0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.5; }
    50% { transform: translateX(-50%) translateY(8px); opacity: 0.3; }
`;

const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 15px rgba(201,162,39,0.2), 0 4px 12px rgba(0,0,0,0.3); }
    50% { box-shadow: 0 0 25px rgba(201,162,39,0.4), 0 4px 16px rgba(0,0,0,0.3); }
`;

interface HeroSectionProps {
    title: string;
    subtitle?: string;
    eventDate?: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    children?: ReactNode;
    minHeight?: string | number;
}

export function HeroSection({
    title,
    subtitle,
    eventDate,
    backgroundImage,
    ctaText,
    ctaHref,
    secondaryCtaText,
    secondaryCtaHref,
    children,
    minHeight = "85vh",
}: HeroSectionProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const bgDefault = theme.palette.background.default;
    const goldMain = theme.palette.primary.main;

    return (
        <Box
            sx={{
                position: "relative",
                minHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "background.default",
                color: isDark ? "common.white" : "text.primary",
                overflow: "hidden",
                "&::before": backgroundImage
                    ? {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          opacity: isDark ? 0.45 : 0.55,
                          filter: "grayscale(0.4) sepia(0.2) saturate(1.2) brightness(0.7)",
                      }
                    : undefined,
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background: [
                        `radial-gradient(ellipse at center 40%, ${alpha(bgDefault, isDark ? 0.2 : 0.05)} 0%, ${alpha(bgDefault, isDark ? 0.6 : 0.4)} 50%, ${alpha(bgDefault, isDark ? 0.92 : 0.85)} 85%, ${bgDefault} 100%)`,
                        `linear-gradient(to bottom, transparent 0%, transparent 65%, ${bgDefault} 100%)`,
                        `linear-gradient(to bottom, ${alpha(goldMain, 0.05)} 0%, transparent 40%)`,
                    ].join(", "),
                }}
            />

            <Container
                maxWidth="lg"
                sx={{
                    position: "relative",
                    zIndex: 1,
                    textAlign: "center",
                    py: { xs: 10, md: 16 },
                }}
            >
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        color: isDark ? "common.white" : "text.primary",
                        fontSize: {
                            xs: "3rem",
                            sm: "4rem",
                            md: "5rem",
                        },
                        letterSpacing: "0.12em",
                        mb: 3,
                        textShadow: isDark
                            ? `0 0 40px ${alpha(goldMain, 0.15)}, 0 4px 20px rgba(0,0,0,0.5)`
                            : `0 2px 12px rgba(255,255,255,0.6)`,
                    }}
                >
                    {title}
                </Typography>

                {eventDate && (
                    <Box
                        sx={{
                            display: "inline-block",
                            mb: 2,
                        }}
                    >
                        <Typography
                            component="p"
                            sx={{
                                fontFamily: '"Cinzel", serif',
                                fontWeight: 600,
                                fontSize: {
                                    xs: "1.1rem",
                                    sm: "1.25rem",
                                    md: "1.4rem",
                                },
                                letterSpacing: "0.08em",
                                color: isDark ? "primary.main" : "text.primary",
                                textShadow: isDark
                                    ? "none"
                                    : "0 1px 6px rgba(255,255,255,0.5)",
                            }}
                        >
                            {eventDate}
                        </Typography>
                        <OrnamentalUnderline />
                    </Box>
                )}

                {subtitle && (
                    <Typography
                        variant="h5"
                        component="p"
                        sx={{
                            mb: 4,
                            maxWidth: 700,
                            mx: "auto",
                            fontFamily: '"Lato", sans-serif',
                            fontWeight: 500,
                            fontSize: {
                                xs: "1rem",
                                sm: "1.1rem",
                            },
                            color: "text.primary",
                            textShadow: isDark
                                ? "none"
                                : "0 1px 6px rgba(255,255,255,0.5)",
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {children}

                {(ctaText || secondaryCtaText) && (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 3,
                            justifyContent: "center",
                            flexWrap: "wrap",
                            mt: 4,
                        }}
                    >
                        {ctaText && ctaHref && (
                            <LinkButton
                                href={ctaHref}
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{
                                    px: 5,
                                    py: 2,
                                    fontSize: "1.2rem",
                                    animation: `${pulseGlow} 2s ease-in-out infinite`,
                                    "&:hover": {
                                        animation: "none",
                                        boxShadow: `0 0 30px ${alpha(goldMain, 0.5)}, 0 4px 20px rgba(0,0,0,0.3)`,
                                    },
                                }}
                            >
                                {ctaText}
                            </LinkButton>
                        )}
                        {secondaryCtaText && secondaryCtaHref && (
                            <LinkButton
                                href={secondaryCtaHref}
                                variant="outlined"
                                color="secondary"
                                size="large"
                                sx={{
                                    px: 5,
                                    py: 2,
                                    fontSize: "1.1rem",
                                    backdropFilter: "blur(4px)",
                                    backgroundColor: alpha(
                                        bgDefault,
                                        isDark ? 0.3 : 0.8
                                    ),
                                    borderColor: "primary.main",
                                    color: "primary.main",
                                    "&:hover": {
                                        backgroundColor: alpha(goldMain, 0.1),
                                        borderColor: "primary.light",
                                        color: "primary.light",
                                    },
                                }}
                            >
                                {secondaryCtaText}
                            </LinkButton>
                        )}
                    </Box>
                )}
            </Container>

            {/* Scroll indicator */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 24,
                    left: "50%",
                    animation: `${bounce} 2s ease-in-out infinite`,
                    color: "primary.main",
                    zIndex: 1,
                }}
            >
                <KeyboardArrowDown sx={{ fontSize: "2rem" }} />
            </Box>
        </Box>
    );
}
