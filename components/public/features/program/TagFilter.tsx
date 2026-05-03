"use client";

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
import {
    FilterChips,
    FilterChipItem,
} from "@/components/public/ui/FilterChips";

interface TagFilterProps {
    tags: string[];
    selectedTag: string | null;
    onTagChange: (tag: string | null) => void;
}

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
    const items: FilterChipItem[] = [
        { key: "__all__", label: "Vše", icon: <FilterList /> },
        ...tags.map((tag) => ({
            key: tag,
            label: tag,
            icon: getTagIcon(tag),
        })),
    ];

    return (
        <FilterChips
            items={items}
            selectedKey={selectedTag ?? "__all__"}
            onSelect={(key) =>
                onTagChange(key === "__all__" ? null : key)
            }
            sx={{ mb: 3, mt: 4, pb: 2 }}
        />
    );
}
