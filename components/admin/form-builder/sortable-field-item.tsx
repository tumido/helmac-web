"use client";

import { Box, Paper } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Position of this row within a block-group:
 * - "standalone"   — root row, not part of a block group
 * - "block-solo"   — block header with no children below
 * - "block-head"   — block header with at least one child below
 * - "block-middle" — child inside a block, not the last child
 * - "block-tail"   — last child of a block group
 */
export type BlockPosition =
    | "standalone"
    | "block-solo"
    | "block-head"
    | "block-middle"
    | "block-tail";

interface SortableFieldItemProps {
    id: string;
    blockPosition?: BlockPosition;
    children: React.ReactNode;
}

export function SortableFieldItem({
    id,
    blockPosition = "standalone",
    children,
}: SortableFieldItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isBlockMember = blockPosition !== "standalone";
    const isBlockHead =
        blockPosition === "block-head" || blockPosition === "block-solo";
    const isBlockTail =
        blockPosition === "block-tail" || blockPosition === "block-solo";
    const isBlockChild =
        blockPosition === "block-middle" || blockPosition === "block-tail";

    // Block group treatment: continuous blue rail + muted bg on the wrapper.
    // Block-child rows additionally wrap their drag-handle+content in an
    // inner outlined white card, with padding on the wrapper acting as a
    // visible gutter — same look as the original master.
    const wrapperSx = {
        display: "flex",
        alignItems: "stretch",
        mb: isBlockMember && !isBlockTail ? 0 : 1,
        // Remove the standard outlined border on block-member wrappers — the
        // group is delineated by the left rail and the inner card outline.
        border: isBlockMember ? "none" : undefined,
        borderLeft: isBlockMember ? "4px solid" : undefined,
        borderLeftColor: isBlockMember ? "info.main" : undefined,
        backgroundColor: isBlockMember ? "action.hover" : undefined,
        borderTopLeftRadius: isBlockMember && !isBlockHead ? 0 : 8,
        borderTopRightRadius: isBlockMember && !isBlockHead ? 0 : 8,
        borderBottomLeftRadius: isBlockMember && !isBlockTail ? 0 : 8,
        borderBottomRightRadius: isBlockMember && !isBlockTail ? 0 : 8,
        // Gutter around the inner card for block-child rows.
        pl: isBlockChild ? 3 : 0,
        pr: isBlockChild ? 1 : 0,
        pt: isBlockChild ? 0.5 : 0,
        pb: isBlockChild && isBlockTail ? 1 : isBlockChild ? 0.5 : 0,
        "&:last-child": { mb: 0 },
    } as const;

    const dragHandle = (
        <Box
            {...attributes}
            {...listeners}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1.5,
                cursor: "grab",
                color: "text.disabled",
                "&:hover": { color: "text.secondary" },
                "&:active": { cursor: "grabbing" },
            }}
        >
            <DragIndicator />
        </Box>
    );

    const content = (
        <Box sx={{ flex: 1, overflow: "hidden" }}>{children}</Box>
    );

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant={isDragging ? "elevation" : "outlined"}
            elevation={isDragging ? 4 : 0}
            sx={wrapperSx}
        >
            {isBlockChild ? (
                <Paper
                    variant="outlined"
                    sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 2,
                        backgroundColor: "background.paper",
                        overflow: "hidden",
                    }}
                >
                    {dragHandle}
                    {content}
                </Paper>
            ) : (
                <>
                    {dragHandle}
                    {content}
                </>
            )}
        </Paper>
    );
}
