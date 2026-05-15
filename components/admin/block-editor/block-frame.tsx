"use client";

import { forwardRef } from "react";
import { Box, type BoxProps, IconButton, Typography } from "@mui/material";
import {
    ContentCopy,
    Delete,
    DragIndicator,
} from "@mui/icons-material";
import type { ContentBlockType } from "@/lib/types/content-blocks";
import { BLOCK_META } from "./block-meta";

interface BlockFrameProps extends BoxProps {
    type: ContentBlockType;
    width: number;
    onDuplicate?: () => void;
    onDelete: () => void;
    children: React.ReactNode;
}

export const BlockFrame = forwardRef<
    HTMLDivElement,
    BlockFrameProps
>(function BlockFrame(
    {
        type,
        width,
        onDuplicate,
        onDelete,
        children,
        style,
        className,
        ...rest
    },
    ref
) {
    const meta = BLOCK_META[type];

    return (
        <Box
            ref={ref}
            style={style}
            className={className}
            {...rest}
            sx={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                backgroundColor: "background.paper",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 0.5,
                    backgroundColor: "action.hover",
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
                    <DragIndicator sx={{ fontSize: 16 }} />
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
                        <ContentCopy sx={{ fontSize: 14 }} />
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
            </Box>

            <Box
                sx={{
                    flex: 1,
                    overflow: "auto",
                    minHeight: 0,
                }}
            >
                {children}
            </Box>
        </Box>
    );
});
