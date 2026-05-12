"use client";

import { type SetStateAction, useState, useCallback, useRef, useMemo } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import {
    Add,
    ContentCopy,
    Delete,
    TextFields,
    Image as ImageIcon,
    HorizontalRule,
    DragIndicator,
    ViewAgenda,
} from "@mui/icons-material";
import GridLayout, {
    type Layout,
    type LayoutItem,
} from "react-grid-layout";
import { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { BlockTypeSelector } from "./block-type-selector";
import { RichTextBlockEditor } from "./richtext-block-editor";
import { ImageBlockEditor } from "./image-block-editor";
import { DividerBlockEditor } from "./divider-block-editor";
import { CardBlockEditor } from "./card-block-editor";
import type {
    ContentBlock,
    ContentBlockType,
} from "@/lib/types/content-blocks";
import { createBlock, normalizeBlocks } from "@/lib/types/content-blocks";

const BLOCK_META: Record<
    ContentBlockType,
    { label: string; icon: React.ReactNode }
> = {
    richtext: { label: "Text", icon: <TextFields fontSize="small" /> },
    image: { label: "Obrázek", icon: <ImageIcon fontSize="small" /> },
    divider: { label: "Oddělovač", icon: <HorizontalRule fontSize="small" /> },
    card: { label: "Karta", icon: <ViewAgenda fontSize="small" /> },
};

const ROW_HEIGHT = 30;

function blocksToLayout(blocks: ContentBlock[]): Layout {
    return blocks.map((b) => ({
        i: b.id,
        x: b.layout.x,
        y: b.layout.y,
        w: b.layout.w,
        h: b.layout.h,
        minW: 1,
        minH: 1,
    }));
}

interface BlockEditorProps {
    value: ContentBlock[];
    onChange: (blocks: SetStateAction<ContentBlock[]>) => void;
    yearId?: string;
}

export function BlockEditor({ value: rawValue, onChange, yearId }: BlockEditorProps) {
    const value = useMemo(() => normalizeBlocks(rawValue), [rawValue]);

    const [selectorAnchor, setSelectorAnchor] = useState<HTMLElement | null>(
        null
    );
    const { width, containerRef, mounted } = useContainerWidth({
        measureBeforeMount: false,
        initialWidth: 800,
    });

    const isUpdatingRef = useRef(false);

    const handleAddBlock = useCallback(
        (type: ContentBlockType) => {
            const block = createBlock(type);
            onChange((prev) => [...prev, block]);
        },
        [onChange]
    );

    const handleUpdateBlock = useCallback(
        (id: string, updated: ContentBlock) => {
            isUpdatingRef.current = true;
            onChange((prev) =>
                prev.map((b) => (b.id === id ? updated : b))
            );
            requestAnimationFrame(() => {
                isUpdatingRef.current = false;
            });
        },
        [onChange]
    );

    const handleDeleteBlock = useCallback(
        (id: string) => {
            onChange((prev) => prev.filter((b) => b.id !== id));
        },
        [onChange]
    );

    const handleDuplicateBlock = useCallback(
        (id: string) => {
            onChange((prev) => {
                const source = prev.find((b) => b.id === id);
                if (!source) return prev;
                const copy = {
                    ...structuredClone(source),
                    id: crypto.randomUUID(),
                    layout: { ...source.layout, y: Infinity },
                };
                return [...prev, copy];
            });
        },
        [onChange]
    );

    const handleLayoutChange = useCallback(
        (newLayout: Layout) => {
            if (isUpdatingRef.current) return;

            onChange((prev) => {
                const blocks = prev.map((block) => {
                    const item = newLayout.find(
                        (l: LayoutItem) => l.i === block.id
                    );
                    if (!item) return block;
                    if (
                        block.layout.x === item.x &&
                        block.layout.y === item.y &&
                        block.layout.w === item.w &&
                        block.layout.h === item.h
                    ) {
                        return block;
                    }
                    return {
                        ...block,
                        layout: {
                            x: item.x,
                            y: item.y,
                            w: item.w,
                            h: item.h,
                        },
                    };
                });

                const changed = blocks.some(
                    (b, i) => b.layout !== prev[i]?.layout
                );
                return changed ? blocks : prev;
            });
        },
        [onChange]
    );

    const renderBlockEditor = (block: ContentBlock) => {
        switch (block.type) {
            case "richtext":
                return (
                    <RichTextBlockEditor
                        block={block}
                        onChange={(b) => handleUpdateBlock(block.id, b)}
                        yearId={yearId}
                    />
                );
            case "image":
                return (
                    <ImageBlockEditor
                        block={block}
                        onChange={(b) => handleUpdateBlock(block.id, b)}
                    />
                );
            case "divider":
                return (
                    <DividerBlockEditor
                        block={block}
                        onChange={(b) => handleUpdateBlock(block.id, b)}
                    />
                );
            case "card":
                return (
                    <CardBlockEditor
                        block={block}
                        onChange={(b) => handleUpdateBlock(block.id, b)}
                        yearId={yearId}
                    />
                );
        }
    };

    const layout = blocksToLayout(value);

    return (
        <Box ref={containerRef}>
            {value.length === 0 ? (
                <Typography
                    color="text.secondary"
                    sx={{
                        textAlign: "center",
                        py: 4,
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 2,
                    }}
                >
                    Stránka je prázdná. Přidejte první blok.
                </Typography>
            ) : (
                mounted && (
                    <GridLayout
                        layout={layout}
                        width={width}
                        onLayoutChange={handleLayoutChange}
                        gridConfig={{
                            cols: 12,
                            rowHeight: ROW_HEIGHT,
                        }}
                        dragConfig={{
                            handle: ".block-drag-handle",
                        }}
                        resizeConfig={{
                            handles: ["se", "e", "s"],
                        }}
                    >
                        {value.map((block) => {
                            const meta = BLOCK_META[block.type];
                            return (
                                <Box
                                    key={block.id}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        backgroundColor:
                                            "background.paper",
                                    }}
                                >
                                    {/* Compact header */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            px: 0.5,
                                            backgroundColor:
                                                "action.hover",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Box
                                            className="block-drag-handle"
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                cursor: "grab",
                                                color: "text.disabled",
                                                "&:hover": {
                                                    color: "text.secondary",
                                                },
                                                "&:active": {
                                                    cursor: "grabbing",
                                                },
                                            }}
                                        >
                                            <DragIndicator
                                                sx={{ fontSize: 16 }}
                                            />
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                color: "text.disabled",
                                                ml: 0.5,
                                            }}
                                        >
                                            {meta.icon}
                                        </Box>
                                        <Box sx={{ flex: 1 }} />
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                        >
                                            {block.layout.w}/12
                                        </Typography>
                                        {block.type === "card" && (
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleDuplicateBlock(
                                                        block.id
                                                    )
                                                }
                                                sx={{
                                                    color: "text.disabled",
                                                    p: 0.25,
                                                    ml: 0.5,
                                                    "&:hover": {
                                                        color: "primary.main",
                                                    },
                                                }}
                                            >
                                                <ContentCopy
                                                    sx={{ fontSize: 14 }}
                                                />
                                            </IconButton>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleDeleteBlock(
                                                    block.id
                                                )
                                            }
                                            sx={{
                                                color: "text.disabled",
                                                p: 0.25,
                                                ml: 0.5,
                                                "&:hover": {
                                                    color: "error.main",
                                                },
                                            }}
                                        >
                                            <Delete
                                                sx={{ fontSize: 14 }}
                                            />
                                        </IconButton>
                                    </Box>

                                    {/* Content — no extra padding */}
                                    <Box
                                        sx={{
                                            flex: 1,
                                            overflow: "auto",
                                            minHeight: 0,
                                        }}
                                    >
                                        {renderBlockEditor(block)}
                                    </Box>
                                </Box>
                            );
                        })}
                    </GridLayout>
                )
            )}

            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={(e) => setSelectorAnchor(e.currentTarget)}
                >
                    Přidat blok
                </Button>
            </Box>

            <BlockTypeSelector
                anchorEl={selectorAnchor}
                onClose={() => setSelectorAnchor(null)}
                onSelect={handleAddBlock}
            />
        </Box>
    );
}
