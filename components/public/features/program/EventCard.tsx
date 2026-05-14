"use client";

import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    CardMedia,
    Link as MuiLink,
    Collapse,
    Chip,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { grainyMaskHorizontal } from "@/lib/utils/grainy-mask";
import {
    Place,
    ArrowForward,
    EmojiEvents,
    Restaurant,
    School,
    LocalFireDepartment,
    SportsKabaddi,
    FestivalOutlined,
} from "@mui/icons-material";
import { ReactElement } from "react";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { storageUrl } from "@/lib/utils/storage";
import { ProgramEvent } from "./program.types";

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
    if (
        locLower.includes("strelnic") ||
        locLower.includes("střelnic")
    ) {
        return <EmojiEvents fontSize="small" />;
    }
    if (
        locLower.includes("cvicist") ||
        locLower.includes("cvičišt")
    ) {
        return <School fontSize="small" />;
    }

    return <Place fontSize="small" />;
}

function formatTimeRange(event: ProgramEvent): string {
    if (event.endTime) {
        return `${event.startTime}–${event.endTime}`;
    }
    return event.startTime;
}

interface EventCardProps {
    event: ProgramEvent;
    onOpenDetails?: () => void;
}

const LINE_CLAMP = 2;

export function EventCard({ event, onOpenDetails }: EventCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const theme = useTheme();
    const hasStoryContent =
        event.storyContent !== null && event.storyContent !== undefined;
    const buttons = Array.isArray(event.actionButtons)
        ? event.actionButtons
        : [];

    const handleTextRef = (element: HTMLDivElement | null) => {
        if (element) {
            const isOverflowing =
                element.scrollHeight > element.clientHeight;
            setNeedsExpansion(isOverflowing);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                py: 2,
                px: { xs: 2, sm: 3 },
                "&:hover img": { filter: "none" },
            }}
        >
            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                }}
            >
                {/* Title row */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 1.5,
                        flexWrap: "wrap",
                    }}
                >
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 700,
                            fontSize: {
                                xs: "1.15rem",
                                sm: "1.3rem",
                            },
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                            lineHeight: 1.3,
                        }}
                    >
                        {event.title}
                    </Typography>

                    {event.endTime && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.muted",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                whiteSpace: "nowrap",
                            }}
                        >
                            do {event.endTime}
                        </Typography>
                    )}
                </Box>

                {/* Location */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "primary.main",
                    }}
                >
                    {getLocationIcon(event.location)}
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            fontSize: "0.9rem",
                            color: "inherit",
                        }}
                    >
                        {event.location}
                    </Typography>

                    {event.tags.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 0.5,
                                ml: 1,
                            }}
                        >
                            {event.tags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        height: 22,
                                        fontSize: "0.75rem",
                                        borderRadius: "10px",
                                        backgroundColor: alpha(
                                            theme.palette
                                                .primary.main,
                                            0.1
                                        ),
                                        color: "primary.main",
                                        "& .MuiChip-label": {
                                            px: 0.75,
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Description */}
                <Box sx={{ mt: 0.5 }}>
                    <Collapse in={isExpanded} collapsedSize={48}>
                        <Box
                            ref={
                                !isExpanded
                                    ? handleTextRef
                                    : undefined
                            }
                            sx={{
                                ...(!isExpanded && {
                                    display: "-webkit-box",
                                    WebkitLineClamp: LINE_CLAMP,
                                    WebkitBoxOrient:
                                        "vertical",
                                    overflow: "hidden",
                                }),
                                lineHeight: 1.5,
                                "& p": {
                                    m: 0,
                                },
                            }}
                        >
                            <MarkdownContent
                                content={
                                    event.description
                                }
                            />
                        </Box>
                    </Collapse>

                    {buttons.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                mt: 1,
                            }}
                        >
                            {buttons.map((btn) => (
                                <Button
                                    key={btn.url}
                                    href={btn.url}
                                    variant={
                                        btn.variant ??
                                        "contained"
                                    }
                                    size="small"
                                    sx={{
                                        textTransform:
                                            "none",
                                    }}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mt: 0.5,
                        }}
                    >
                        {needsExpansion && !isExpanded && (
                            <MuiLink
                                component="button"
                                variant="body2"
                                onClick={() => setIsExpanded(true)}
                                sx={{
                                    color: "primary.main",
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    fontSize: "0.85rem",
                                    "&:hover": {
                                        textDecoration:
                                            "underline",
                                    },
                                }}
                            >
                                více...
                            </MuiLink>
                        )}
                        {isExpanded && (
                            <MuiLink
                                component="button"
                                variant="body2"
                                onClick={() =>
                                    setIsExpanded(false)
                                }
                                sx={{
                                    color: "primary.main",
                                    cursor: "pointer",
                                    textDecoration: "none",
                                    fontSize: "0.85rem",
                                    "&:hover": {
                                        textDecoration:
                                            "underline",
                                    },
                                }}
                            >
                                méně
                            </MuiLink>
                        )}

                        {hasStoryContent && (
                            <Button
                                variant="text"
                                size="small"
                                endIcon={
                                    <ArrowForward
                                        sx={{
                                            fontSize:
                                                "0.85rem !important",
                                        }}
                                    />
                                }
                                onClick={onOpenDetails}
                                sx={{
                                    color: "primary.main",
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                    px: 0.5,
                                    py: 0,
                                    minWidth: "auto",
                                    textTransform: "none",
                                    "&:hover": {
                                        backgroundColor:
                                            "transparent",
                                        textDecoration:
                                            "underline",
                                    },
                                }}
                            >
                                Více info
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Image (optional) */}
            {event.imageUrl && (
                <Box
                    sx={{
                        width: { xs: 70, sm: 100 },
                        flexShrink: 0,
                        ml: 2,
                        display: "flex",
                        alignItems: "flex-start",
                    }}
                >
                    <CardMedia
                        component="img"
                        image={storageUrl(event.imageUrl)}
                        alt={event.title}
                        sx={{
                            width: "100%",
                            height: { xs: 60, sm: 80 },
                            objectFit: "cover",
                            borderRadius: 1,
                            ...grainyMaskHorizontal,
                            filter: "grayscale(0.3) sepia(0.15) saturate(1.1) brightness(0.9)",
                            transition: "filter 0.4s ease",
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}

export { formatTimeRange };
