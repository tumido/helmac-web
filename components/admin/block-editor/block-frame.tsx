"use client";

import { Box, IconButton, Typography } from "@mui/material";
import { ContentCopy, Delete } from "@mui/icons-material";
import type { ContentBlockType } from "@/lib/types/content-blocks";
import type {
    DraggableAttributes,
    DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { BLOCK_META } from "./block-meta";

interface BlockFrameProps {
    type: ContentBlockType;
    width: number;
    onDuplicate?: () => void;
    onDelete: () => void;
    dragHandleListeners?: DraggableSyntheticListeners;
    dragHandleAttributes?: DraggableAttributes;
    children: React.ReactNode;
}

export function BlockFrame({
    type,
    width,
    onDuplicate,
    onDelete,
    dragHandleListeners,
    dragHandleAttributes,
    children,
}: BlockFrameProps) {
    const meta = BLOCK_META[type];

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor:
                    type === "group"
                        ? "transparent"
                        : "background.paper",
                height: "100%",
            }}
        >
            <Box
                {...dragHandleAttributes}
                {...dragHandleListeners}
                suppressHydrationWarning
                sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    px: 0.5,
                    backgroundColor: "action.hover",
                    flexShrink: 0,
                    cursor: "grab",
                    "&:active": { cursor: "grabbing" },
                    "& > [data-drag-dots]": {
                        visibility: "hidden",
                    },
                    "&:hover > [data-drag-dots]": {
                        visibility: "visible",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "text.disabled",
                    }}
                >
                    {meta?.icon}
                </Box>
                <Box sx={{ flex: 1 }} />
                <Typography
                    variant="caption"
                    color="text.disabled"
                >
                    {width}/12
                </Typography>
                {onDuplicate && (
                    <IconButton
                        size="small"
                        onClick={onDuplicate}
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
                    onClick={onDelete}
                    sx={{
                        color: "text.disabled",
                        p: 0.25,
                        ml: 0.5,
                        "&:hover": {
                            color: "error.main",
                        },
                    }}
                >
                    <Delete sx={{ fontSize: 14 }} />
                </IconButton>

                <Box
                    data-drag-dots
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform:
                            "translate(-50%, -50%)",
                        display: "flex",
                        gap: "3px",
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor:
                                    "primary.main",
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
                {children}
            </Box>
        </Box>
    );
}
