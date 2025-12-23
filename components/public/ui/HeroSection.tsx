"use client";

import { Box, Container, Typography, Button } from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";

interface HeroSectionProps {
    title: string;
    subtitle?: string;
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
    backgroundImage,
    ctaText,
    ctaHref,
    secondaryCtaText,
    secondaryCtaHref,
    children,
    minHeight = "70vh",
}: HeroSectionProps) {
    return (
        <Box
            sx={{
                position: "relative",
                minHeight,
                display: "flex",
                alignItems: "center",
                backgroundColor: "background.default",
                color: "common.white",
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
                    background:
                        "linear-gradient(to bottom, rgba(13, 13, 13, 0.7) 0%, rgba(13, 13, 13, 0.95) 100%)",
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
                        color: "common.white",
                        fontSize: { xs: "2.5rem", md: "4rem" },
                        mb: 3,
                        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    }}
                >
                    {title}
                </Typography>

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
                            <Button
                                component={Link}
                                href={ctaHref}
                                variant="contained"
                                color="secondary"
                                size="large"
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                }}
                            >
                                {ctaText}
                            </Button>
                        )}
                        {secondaryCtaText && secondaryCtaHref && (
                            <Button
                                component={Link}
                                href={secondaryCtaHref}
                                variant="outlined"
                                size="large"
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                    color: "common.white",
                                    borderColor: "common.white",
                                    "&:hover": {
                                        borderColor: "secondary.main",
                                        color: "secondary.main",
                                    },
                                }}
                            >
                                {secondaryCtaText}
                            </Button>
                        )}
                    </Box>
                )}
            </Container>
        </Box>
    );
}
