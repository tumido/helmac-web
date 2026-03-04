"use client";

import { Box, Paper } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableFieldItemProps {
    id: string;
    children: React.ReactNode;
}

export function SortableFieldItem({ id, children }: SortableFieldItemProps) {
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

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                "&:last-child": { mb: 0 },
            }}
            elevation={isDragging ? 4 : 1}
        >
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
            <Box sx={{ flex: 1, overflow: "hidden" }}>{children}</Box>
        </Paper>
    );
}
