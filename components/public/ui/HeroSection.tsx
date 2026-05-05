"use client";

import { Box, Container, Typography, useTheme } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { ReactNode } from "react";

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
    minHeight = "70vh",
}: HeroSectionProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box
            sx={{
                position: "relative",
                minHeight,
                display: "flex",
                alignItems: "center",
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
                          opacity: 0.3,
                      }
                    : undefined,
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
                        ? "linear-gradient(to bottom, rgba(13, 13, 13, 0.7) 0%, rgba(13, 13, 13, 0.95) 100%)"
                        : "linear-gradient(to bottom, rgba(245, 242, 235, 0.7) 0%, rgba(245, 242, 235, 0.95) 100%)",
                }}
            />

            <Container
                maxWidth="lg"
                sx={{
                    position: "relative",
                    zIndex: 1,
                    textAlign: "center",
                    py: { xs: 8, md: 12 },
                }}
            >
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        color: isDark ? "common.white" : "primary.dark",
                        fontSize: { xs: "2.5rem", md: "4rem" },
                        mb: 3,
                        textShadow: isDark
                            ? "0 2px 10px rgba(0,0,0,0.3)"
                            : "0 2px 10px rgba(255,255,255,0.3)",
                    }}
                >
                    {title}
                </Typography>

                {eventDate && (
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
                            color: isDark ? "primary.main" : "primary.dark",
                            mt: -1,
                            mb: 2,
                        }}
                    >
                        {eventDate}
                    </Typography>
                )}

                {subtitle && (
                    <Typography
                        variant="h5"
                        component="p"
                        sx={{
                            mb: 4,
                            opacity: 0.9,
                            maxWidth: 700,
                            mx: "auto",
                            fontFamily: '"Merriweather", serif',
                            fontWeight: 300,
                            fontSize: { xs: "1rem", sm: "1.1rem" },
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
                            gap: 2,
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
                                    px: 4,
                                    py: 1.5,
                                    fontSize: "1.1rem",
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
                                    px: 4,
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                }}
                            >
                                {secondaryCtaText}
                            </LinkButton>
                        )}
                    </Box>
                )}
            </Container>
        </Box>
    );
}
