"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import type { ContentBlock } from "@/lib/types/content-blocks";
import { normalizeBlocks } from "@/lib/types/content-blocks";
import type { RegistrationStats } from "@/lib/services/registration";
import { RichTextBlockRenderer } from "./richtext-block";
import { ImageBlockRenderer } from "./image-block";
import { DividerBlockRenderer } from "./divider-block";
import { CardBlockRenderer } from "./card-block";
import { StatSingleBlockRenderer } from "./stat-single-block";
import { StatTableBlockRenderer } from "./stat-table-block";
import { StatCardsBlockRenderer } from "./stat-cards-block";
import { GroupBlockRenderer } from "./group-block";

function renderBlock(
    block: ContentBlock,
    tocIds?: Map<string, string>,
    stats?: Record<string, RegistrationStats>
) {
    switch (block.type) {
        case "richtext":
            return (
                <RichTextBlockRenderer block={block} tocIds={tocIds} />
            );
        case "image":
            return <ImageBlockRenderer block={block} />;
        case "divider":
            return <DividerBlockRenderer block={block} />;
        case "card":
            return <CardBlockRenderer block={block} />;
        case "stat_single":
            return <StatSingleBlockRenderer block={block} stats={stats?.[block.id]} />;
        case "stat_table":
            return <StatTableBlockRenderer block={block} stats={stats?.[block.id]} />;
        case "stat_cards":
            return <StatCardsBlockRenderer block={block} stats={stats?.[block.id]} />;
        case "group":
            return <GroupBlockRenderer block={block} tocIds={tocIds} stats={stats} />;
    }
}

interface BlockRendererProps {
    blocks: ContentBlock[];
    tocIds?: Map<string, string>;
    stats?: Record<string, RegistrationStats>;
}

export function BlockRenderer({ blocks, tocIds, stats }: BlockRendererProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const normalized = normalizeBlocks(blocks);
    const sorted = [...normalized].sort((a, b) => {
        if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
        return a.layout.x - b.layout.x;
    });

    if (isMobile) {
        return (
            <>
                {sorted.map((block) => (
                    <Box key={block.id} sx={{ mb: 4 }}>
                        {renderBlock(block, tocIds, stats)}
                    </Box>
                ))}
            </>
        );
    }

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                alignItems: "center",
                gap: 4,
            }}
        >
            {sorted.map((block) => (
                <Box
                    key={block.id}
                    sx={{
                        gridColumn: `${block.layout.x + 1} / span ${block.layout.w}`,
                        alignSelf:
                            block.type === "card" ||
                            block.type === "stat_single" ||
                            block.type === "stat_table" ||
                            block.type === "stat_cards"
                                ? "stretch"
                                : "center",
                    }}
                >
                    {renderBlock(block, tocIds, stats)}
                </Box>
            ))}
        </Box>
    );
}
