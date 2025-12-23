"use client";

import { Box, Chip, useTheme } from "@mui/material";
import {
    FilterList,
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

interface TagFilterProps {
    tags: string[];
    selectedTag: string | null;
    onTagChange: (tag: string | null) => void;
}

// Map tags to icons
function getTagIcon(tag: string): ReactElement | undefined {
    const tagLower = tag.toLowerCase();

    if (tagLower.includes("turnaj") || tagLower.includes("turnaje")) {
        return <EmojiEvents />;
    }
    if (
        tagLower.includes("bitv") ||
        tagLower.includes("boj") ||
        tagLower.includes("souboj")
    ) {
        return <SportsKabaddi />;
    }
    if (
        tagLower.includes("jidlo") ||
        tagLower.includes("jídlo") ||
        tagLower.includes("obed") ||
        tagLower.includes("vecere") ||
        tagLower.includes("snidan")
    ) {
        return <Restaurant />;
    }
    if (tagLower.includes("spolec") || tagLower.includes("společ")) {
        return <Groups />;
    }
    if (tagLower.includes("zabav") || tagLower.includes("zábav")) {
        return <Celebration />;
    }
    if (
        tagLower.includes("workshop") ||
        tagLower.includes("dilna") ||
        tagLower.includes("dílna")
    ) {
        return <School />;
    }
    if (tagLower.includes("sem") || tagLower.includes("šerm")) {
        return <Shield />;
    }
    if (
        tagLower.includes("ohen") ||
        tagLower.includes("oheň") ||
        tagLower.includes("tabor")
    ) {
        return <LocalFireDepartment />;
    }
    if (
        tagLower.includes("hudba") ||
        tagLower.includes("musik") ||
        tagLower.includes("koncert")
    ) {
        return <MusicNote />;
    }
    if (
        tagLower.includes("vylet") ||
        tagLower.includes("výlet") ||
        tagLower.includes("pochod")
    ) {
        return <Hiking />;
    }
    if (tagLower.includes("hlavni") || tagLower.includes("hlavní")) {
        return <Star />;
    }

    return undefined;
}

export function TagFilter({ tags, selectedTag, onTagChange }: TagFilterProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isSelected = (tag: string | null) => selectedTag === tag;

    const chipStyles = (selected: boolean) => ({
        borderRadius: "50px",
        height: 40,
        px: 1,
        fontSize: "0.95rem",
        fontWeight: selected ? 700 : 500,
        border: "2px solid",
        borderColor: selected ? "primary.main" : isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(45, 42, 38, 0.25)",
        backgroundColor: selected ? "primary.main" : "transparent",
        color: selected ? "primary.contrastText" : "text.primary",
        transition: "all 0.2s ease-in-out",
        "& .MuiChip-icon": {
            color: selected ? "primary.contrastText" : "primary.main",
            marginLeft: "8px",
            fontSize: "1.2rem",
        },
        "& .MuiChip-label": {
            px: 1.5,
        },
        "&:hover": {
            backgroundColor: selected
                ? "primary.dark"
                : "rgba(201, 162, 39, 0.15)",
            borderColor: selected ? "primary.dark" : "rgba(201, 162, 39, 0.5)",
        },
    });

    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                mb: 3,
                mt: 4,
                pb: 2,
                overflowX: "auto",
                "&::-webkit-scrollbar": {
                    height: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: isDark ? "rgba(201, 162, 39, 0.3)" : "rgba(154, 123, 26, 0.4)",
                    borderRadius: 2,
                },
            }}
        >
            <Chip
                icon={<FilterList />}
                label="Vse"
                onClick={() => onTagChange(null)}
                sx={chipStyles(isSelected(null))}
            />
            {tags.map((tag) => {
                const icon = getTagIcon(tag);
                return (
                    <Chip
                        key={tag}
                        icon={icon}
                        label={tag}
                        onClick={() => onTagChange(tag)}
                        sx={chipStyles(isSelected(tag))}
                    />
                );
            })}
        </Box>
    );
}
