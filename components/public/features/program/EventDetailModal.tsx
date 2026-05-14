"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Chip,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Close,
    AccessTime,
    Place,
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
} from "@mui/icons-material";
import { ReactElement } from "react";
import { grainyMaskBoth } from "@/lib/utils/grainy-mask";
import { ProgramEvent } from "./program.types";
import { storageUrl } from "@/lib/utils/storage";
import { Prisma } from "@prisma/client";

// Map tags to icons
function getTagIcon(tag: string): ReactElement | undefined {
    const tagLower = tag.toLowerCase();

    if (tagLower.includes("turnaj") || tagLower.includes("turnaje")) {
        return <EmojiEvents fontSize="small" />;
    }
    if (tagLower.includes("bitv") || tagLower.includes("boj") || tagLower.includes("souboj")) {
        return <SportsKabaddi fontSize="small" />;
    }
    if (tagLower.includes("jidlo") || tagLower.includes("jídlo") || tagLower.includes("obed") || tagLower.includes("vecere") || tagLower.includes("snidan")) {
        return <Restaurant fontSize="small" />;
    }
    if (tagLower.includes("spolec") || tagLower.includes("společ")) {
        return <Groups fontSize="small" />;
    }
    if (tagLower.includes("zabav") || tagLower.includes("zábav")) {
        return <Celebration fontSize="small" />;
    }
    if (tagLower.includes("workshop") || tagLower.includes("dilna") || tagLower.includes("dílna")) {
        return <School fontSize="small" />;
    }
    if (tagLower.includes("sem") || tagLower.includes("šerm")) {
        return <Shield fontSize="small" />;
    }
    if (tagLower.includes("ohen") || tagLower.includes("oheň") || tagLower.includes("tabor")) {
        return <LocalFireDepartment fontSize="small" />;
    }
    if (tagLower.includes("hudba") || tagLower.includes("musik") || tagLower.includes("koncert")) {
        return <MusicNote fontSize="small" />;
    }
    if (tagLower.includes("vylet") || tagLower.includes("výlet") || tagLower.includes("pochod")) {
        return <Hiking fontSize="small" />;
    }
    if (tagLower.includes("hlavni") || tagLower.includes("hlavní")) {
        return <Star fontSize="small" />;
    }

    return undefined;
}

interface EventDetailModalProps {
    event: ProgramEvent | null;
    open: boolean;
    onClose: () => void;
}

// Render story content from JSON
function renderStoryContent(content: Prisma.JsonValue): React.ReactNode {
    if (!content) return null;

    // If content is a string, render as simple text
    if (typeof content === "string") {
        return (
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {content}
            </Typography>
        );
    }

    // If content is an object with paragraphs array
    if (
        typeof content === "object" &&
        content !== null &&
        "paragraphs" in content &&
        Array.isArray((content as { paragraphs: unknown }).paragraphs)
    ) {
        const paragraphs = (content as { paragraphs: string[] }).paragraphs;
        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {paragraphs.map((paragraph, index) => (
                    <Typography key={index} variant="body1">
                        {paragraph}
                    </Typography>
                ))}
            </Box>
        );
    }

    // If content is an object with sections
    if (
        typeof content === "object" &&
        content !== null &&
        "sections" in content &&
        Array.isArray((content as { sections: unknown }).sections)
    ) {
        const sections = (
            content as { sections: { title?: string; text: string }[] }
        ).sections;
        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {sections.map((section, index) => (
                    <Box key={index}>
                        {section.title && (
                            <Typography
                                variant="h6"
                                sx={{
                                    fontFamily: '"Cinzel", serif',
                                    fontWeight: 600,
                                    mb: 1,
                                    color: "primary.main",
                                }}
                            >
                                {section.title}
                            </Typography>
                        )}
                        <Typography variant="body1">{section.text}</Typography>
                    </Box>
                ))}
            </Box>
        );
    }

    // Fallback: render as JSON string
    return (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(content, null, 2)}
        </Typography>
    );
}

export function EventDetailModal({
    event,
    open,
    onClose,
}: EventDetailModalProps) {
    const theme = useTheme();

    if (!event) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            PaperProps={{
                sx: {
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    pr: 6,
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        component="span"
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 700,
                            display: "block",
                        }}
                    >
                        {event.title}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mt: 1,
                            flexWrap: "wrap",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "primary.main",
                            }}
                        >
                            <AccessTime fontSize="small" />
                            <Typography variant="body2" fontWeight="bold">
                                {event.endTime
                                    ? `${event.startTime}–${event.endTime}`
                                    : event.startTime}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "text.secondary",
                            }}
                        >
                            <Place fontSize="small" />
                            <Typography variant="body2">{event.location}</Typography>
                        </Box>
                    </Box>
                    {event.tags.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 1,
                            }}
                        >
                            {event.tags.map((tag) => (
                                <Chip
                                    key={tag}
                                    icon={getTagIcon(tag)}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        borderRadius: "50px",
                                        height: 28,
                                        fontSize: "0.85rem",
                                        fontWeight: 500,
                                        border: "1.5px solid",
                                        borderColor: alpha(theme.palette.text.primary, 0.25),
                                        backgroundColor: "transparent",
                                        color: "text.primary",
                                        "& .MuiChip-icon": {
                                            color: "primary.main",
                                            marginLeft: "6px",
                                            fontSize: "1rem",
                                        },
                                        "& .MuiChip-label": {
                                            px: 1,
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
                <IconButton
                    aria-label="zavrit"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {/* Event Image */}
                {event.imageUrl && (
                    <Box
                        component="img"
                        src={storageUrl(event.imageUrl)}
                        alt={event.title}
                        sx={{
                            width: "100%",
                            maxHeight: 300,
                            objectFit: "cover",
                            borderRadius: 1,
                            mb: 3,
                            ...grainyMaskBoth,
                            filter: "grayscale(0.3) sepia(0.15) saturate(1.1) brightness(0.9)",
                            transition: "filter 0.4s ease",
                            "&:hover": { filter: "none" },
                        }}
                    />
                )}

                {/* Description */}
                <Typography
                    variant="body1"
                    sx={{
                        mb: 3,
                        color: "text.secondary",
                        fontStyle: "italic",
                    }}
                >
                    {event.description}
                </Typography>

                {/* Story Content */}
                {event.storyContent && (
                    <Box
                        sx={{
                            pt: 2,
                            borderTop: 1,
                            borderColor: "divider",
                        }}
                    >
                        {renderStoryContent(event.storyContent)}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
