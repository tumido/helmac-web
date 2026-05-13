"use client";

import { Box, Grid, Typography } from "@mui/material";
import { AnimatedSection } from "@/components/public/ui/AnimatedSection";
import { GameIcon } from "@/lib/icons";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface EventHighlightsProps {
    sections: Array<{
        id: string;
        title: string;
        subtitle: string | null;
        description: string | null;
        icon: string | null;
    }>;
    slug: string;
}

function HighlightCard({
    icon,
    title,
    subtitle,
    description,
}: {
    icon: string;
    title: string;
    subtitle?: string;
    description: string;
}) {
    return (
        <Box
            sx={{
                textAlign: "center",
                px: { xs: 2, md: 3 },
                py: { xs: 3, md: 4 },
            }}
        >
            <Box
                sx={{
                    width: 72,
                    height: 72,
                    mx: "auto",
                    mb: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: "primary.dark",
                    backgroundColor: "rgba(201, 162, 39, 0.06)",
                    transition: "all 0.3s ease",
                }}
            >
                <GameIcon
                    name={icon}
                    sx={{
                        fontSize: "2rem",
                        color: "primary.main",
                    }}
                />
            </Box>
            <Typography
                variant="h6"
                component="h3"
                sx={{ mb: subtitle ? 0.25 : 1 }}
            >
                {title}
            </Typography>
            {subtitle && (
                <Typography
                    variant="subtitle2"
                    sx={{
                        mb: 1,
                        fontWeight: 400,
                        opacity: 0.7,
                    }}
                >
                    {subtitle}
                </Typography>
            )}
            <Typography
                variant="body2"
                component="div"
                sx={{
                    lineHeight: 1.7,
                    maxWidth: 280,
                    mx: "auto",
                    "& p": { m: 0 },
                }}
            >
                <ReactMarkdown>{description}</ReactMarkdown>
            </Typography>
        </Box>
    );
}

export function EventHighlights({ sections, slug }: EventHighlightsProps) {
    return (
        <>
            <Grid container spacing={0} justifyContent="center">
                {sections.map((section, index) => (
                    <Grid item key={section.id} xs={12} sm={6} md={3}>
                        <AnimatedSection delay={index * 80}>
                            <HighlightCard
                                icon={section.icon || "crossed-swords"}
                                title={section.title}
                                subtitle={section.subtitle || undefined}
                                description={section.description || ""}
                            />
                        </AnimatedSection>
                    </Grid>
                ))}
            </Grid>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 4,
                }}
            >
                <Link
                    href={`/${slug}`}
                    style={{
                        fontFamily: '"Cinzel", serif',
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        border: "1px solid",
                        borderColor: "#9A7B1A",
                        color: "#C9A227",
                        padding: "10px 28px",
                        borderRadius: 4,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                    }}
                >
                    Zobrazit vše
                </Link>
            </Box>
        </>
    );
}
