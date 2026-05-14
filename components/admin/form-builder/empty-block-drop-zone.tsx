"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";

interface Props {
    blockId: string;
}

export function EmptyBlockDropZone({ blockId }: Props) {
    const { setNodeRef, isOver } = useDroppable({
        id: `container-${blockId}`,
    });

    return (
        <Paper
            variant="outlined"
            sx={{
                display: "flex",
                alignItems: "stretch",
                mb: 1,
                border: "none",
                borderLeft: "4px solid",
                borderLeftColor: "info.main",
                backgroundColor: "action.hover",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                pl: 3,
                pr: 1,
                pt: 0.5,
                pb: 1,
            }}
        >
            <Box
                ref={setNodeRef}
                sx={{
                    flex: 1,
                    py: 2,
                    textAlign: "center",
                    border: "2px dashed",
                    borderColor: isOver ? "info.main" : "divider",
                    borderRadius: 1,
                    backgroundColor: isOver
                        ? "action.selected"
                        : "background.paper",
                    transition: "all 0.2s ease",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Přetáhněte pole sem
                </Typography>
            </Box>
        </Paper>
    );
}
