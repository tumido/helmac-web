"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import type { ContentBlock } from "@/lib/types/content-blocks";
import { normalizeBlocks } from "@/lib/types/content-blocks";
import { RichTextBlockRenderer } from "./richtext-block";
import { ImageBlockRenderer } from "./image-block";
import { DividerBlockRenderer } from "./divider-block";
import { CardBlockRenderer } from "./card-block";

function renderBlock(
    block: ContentBlock,
    tocIds?: Map<string, string>
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
    }
}

interface BlockRendererProps {
    blocks: ContentBlock[];
    tocIds?: Map<string, string>;
}

export function BlockRenderer({ blocks, tocIds }: BlockRendererProps) {
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
                        {renderBlock(block, tocIds)}
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
                            block.type === "card"
                                ? "stretch"
                                : "center",
                    }}
                >
                    {renderBlock(block, tocIds)}
                </Box>
            ))}
        </Box>
    );
}
