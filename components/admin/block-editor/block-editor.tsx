"use client";

import { type SetStateAction, useState, useCallback, useRef, useMemo } from "react";
import type { BlockLayout } from "@/lib/types/content-blocks";
import { Box, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { EditableGrid } from "./editable-grid";
import { BlockTypeSelector } from "./block-type-selector";
import { BlockFrame } from "./block-frame";
import { BlockContent } from "./block-content";
import type {
    ContentBlock,
    ContentBlockType,
} from "@/lib/types/content-blocks";
import { createBlock, normalizeBlocks } from "@/lib/types/content-blocks";

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
        (layouts: Record<string, BlockLayout>) => {
            onChange((prev) => {
                const blocks = prev.map((block) => {
                    const layout = layouts[block.id];
                    if (!layout) return block;
                    if (
                        block.layout?.x === layout.x &&
                        block.layout?.y === layout.y &&
                        block.layout?.w === layout.w &&
                        block.layout?.h === layout.h
                    ) {
                        return block;
                    }
                    return { ...block, layout };
                });

                const changed = blocks.some(
                    (b, i) => b.layout !== prev[i]?.layout
                );
                return changed ? blocks : prev;
            });
        },
        [onChange]
    );

    return (
        <Box>
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
                <EditableGrid
                    items={value}
                    onLayoutChange={handleLayoutChange}
                    isUpdatingRef={isUpdatingRef}
                >
                    {value.map((block) => (
                        <BlockFrame
                            key={block.id}
                            type={block.type}
                            width={block.layout?.w ?? 12}
                            onDuplicate={
                                block.type === "card"
                                    ? () =>
                                          handleDuplicateBlock(
                                              block.id
                                          )
                                    : undefined
                            }
                            onDelete={() =>
                                handleDeleteBlock(block.id)
                            }
                        >
                            <BlockContent
                                block={block}
                                onChange={(b) =>
                                    handleUpdateBlock(block.id, b)
                                }
                                yearId={yearId}
                            />
                        </BlockFrame>
                    ))}
                </EditableGrid>
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
