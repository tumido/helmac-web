"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Card as MuiCard,
    CardMedia,
    Link as MuiLink,
    Collapse,
    useTheme,
} from "@mui/material";
import {
    Place,
    ArrowForward,
    EmojiEvents,
    Restaurant,
    Groups,
    Celebration,
    School,
    LocalFireDepartment,
    SportsKabaddi,
    Star,
    MusicNote,
    Hiking,
    Shield,
    FestivalOutlined,
} from "@mui/icons-material";
import { ReactElement } from "react";
import { ProgramEvent } from "./program.types";

// Map location keywords to icons
function getLocationIcon(location: string): ReactElement {
    const locLower = location.toLowerCase();

    if (locLower.includes("arena") || locLower.includes("bojist")) {
        return <SportsKabaddi fontSize="small" />;
    }
    if (locLower.includes("jidel") || locLower.includes("kuchyn")) {
        return <Restaurant fontSize="small" />;
    }
    if (locLower.includes("stan") || locLower.includes("tabor")) {
        return <FestivalOutlined fontSize="small" />;
    }
    if (locLower.includes("ohen") || locLower.includes("oheň")) {
        return <LocalFireDepartment fontSize="small" />;
    }
    if (locLower.includes("strelnic") || locLower.includes("střelnic")) {
        return <EmojiEvents fontSize="small" />;
    }
    if (locLower.includes("cvicist") || locLower.includes("cvičišt")) {
        return <School fontSize="small" />;
    }

    return <Place fontSize="small" />;
}

interface EventCardProps {
    event: ProgramEvent;
    onOpenDetails?: () => void;
}

const LINE_CLAMP = 3;

export function EventCard({ event, onOpenDetails }: EventCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const hasStoryContent =
        event.storyContent !== null && event.storyContent !== undefined;

    const handleTextRef = (element: HTMLParagraphElement | null) => {
        if (element) {
            const isOverflowing = element.scrollHeight > element.clientHeight;
            setNeedsExpansion(isOverflowing);
        }
    };

    return (
        <Box sx={{ display: "flex", position: "relative" }}>
            {/* Timeline line */}
            <Box
                sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    backgroundColor: "primary.main",
                    borderRadius: 1,
                }}
            />

            <MuiCard
                sx={{
                    flex: 1,
                    ml: 3,
                    display: "flex",
                    flexDirection: "row",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(45, 42, 38, 0.15)",
                    borderRadius: 2,
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(45, 42, 38, 0.03)",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                        borderColor: "rgba(201, 162, 39, 0.3)",
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(45, 42, 38, 0.05)",
                    },
                }}
            >
                {/* Content */}
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        p: { xs: 2, sm: 2.5 },
                        minHeight: 160,
                    }}
                >
                    {/* Time */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: "primary.main",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            fontSize: "1.1rem",
                            mb: 1,
                        }}
                    >
                        {event.startTime}
                    </Typography>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 700,
                            fontSize: { xs: "1.1rem", sm: "1.25rem" },
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                            mb: 1,
                            lineHeight: 1.3,
                        }}
                    >
                        {event.title}
                    </Typography>

                    {/* Description */}
                    <Collapse in={isExpanded} collapsedSize={60}>
                        <Typography
                            ref={!isExpanded ? handleTextRef : undefined}
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                ...(!isExpanded && {
                                    display: "-webkit-box",
                                    WebkitLineClamp: LINE_CLAMP,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }),
                                lineHeight: 1.5,
                                fontSize: "0.9rem",
                            }}
                        >
                            {event.description}
                        </Typography>
                    </Collapse>

                    {/* Expand link */}
                    {needsExpansion && !isExpanded && (
                        <MuiLink
                            component="button"
                            variant="body2"
                            onClick={() => setIsExpanded(true)}
                            sx={{
                                alignSelf: "flex-start",
                                mt: 0.5,
                                color: "primary.main",
                                cursor: "pointer",
                                textDecoration: "none",
                                fontSize: "0.85rem",
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            vice...
                        </MuiLink>
                    )}
                    {isExpanded && (
                        <MuiLink
                            component="button"
                            variant="body2"
                            onClick={() => setIsExpanded(false)}
                            sx={{
                                alignSelf: "flex-start",
                                mt: 0.5,
                                color: "primary.main",
                                cursor: "pointer",
                                textDecoration: "none",
                                fontSize: "0.85rem",
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            mene
                        </MuiLink>
                    )}

                    {/* Spacer */}
                    <Box sx={{ flex: 1, minHeight: 8 }} />

                    {/* Details button */}
                    {hasStoryContent && (
                        <Button
                            variant="outlined"
                            size="small"
                            endIcon={<ArrowForward sx={{ fontSize: "0.9rem !important" }} />}
                            onClick={onOpenDetails}
                            sx={{
                                alignSelf: "flex-start",
                                borderRadius: "20px",
                                borderColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(45, 42, 38, 0.25)",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                px: 2,
                                py: 0.5,
                                mb: 1.5,
                                textTransform: "none",
                                "&:hover": {
                                    backgroundColor: "rgba(201, 162, 39, 0.1)",
                                    borderColor: "rgba(201, 162, 39, 0.5)",
                                    color: "primary.main",
                                },
                            }}
                        >
                            Vice info
                        </Button>
                    )}

                    {/* Location */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            color: "primary.main",
                        }}
                    >
                        {getLocationIcon(event.location)}
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                fontSize: "0.9rem",
                            }}
                        >
                            {event.location}
                        </Typography>
                    </Box>
                </Box>

                {/* Image (optional) - on the right */}
                {event.imageUrl && (
                    <Box
                        sx={{
                            width: { xs: 100, sm: 140 },
                            flexShrink: 0,
                            p: 1.5,
                            display: "flex",
                            alignItems: "flex-start",
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={event.imageUrl}
                            alt={event.title}
                            sx={{
                                width: "100%",
                                height: { xs: 80, sm: 110 },
                                objectFit: "cover",
                                borderRadius: 1.5,
                            }}
                        />
                    </Box>
                )}
            </MuiCard>
        </Box>
    );
}
