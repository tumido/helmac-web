"use client";

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Delete, AccountTree } from "@mui/icons-material";
import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableFieldItem } from "./sortable-field-item";
import { FieldListItem } from "./field-list-item";
import type { ConditionBlock, FormCondition, FormField } from "@/lib/types/registration-form";

interface ConditionBlockItemProps {
    block: ConditionBlock;
    condition: FormCondition | undefined;
    onEditField: (field: FormField) => void;
    onDeleteField: (fieldId: string) => void;
    onDeleteBlock: (blockId: string) => void;
}

export function ConditionBlockItem({
    block,
    condition,
    onEditField,
    onDeleteField,
    onDeleteBlock,
}: ConditionBlockItemProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `container-${block.id}`,
    });

    return (
        <Box
            sx={{
                borderLeft: "4px solid",
                borderLeftColor: "info.main",
                backgroundColor: isOver ? "action.selected" : "action.hover",
                borderRadius: 1,
                transition: "background-color 0.2s ease",
                mb: 1,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1,
                }}
            >
                <AccountTree fontSize="small" color="info" />
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    Podmínka: {condition?.name || "(nepojmenovaná)"}
                </Typography>
                <Tooltip title="Smazat blok">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteBlock(block.id)}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Children drop zone */}
            <SortableContext
                items={block.children.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
            >
                <Box
                    ref={setNodeRef}
                    sx={{
                        minHeight: 48,
                        pl: 3,
                        pr: 1,
                        pb: 1,
                    }}
                >
                    {block.children.length === 0 ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: "center",
                                py: 2,
                                border: "2px dashed",
                                borderColor: isOver ? "info.main" : "divider",
                                borderRadius: 1,
                            }}
                        >
                            Přetáhněte pole sem
                        </Typography>
                    ) : (
                        block.children.map((child) => (
                            <SortableFieldItem key={child.id} id={child.id}>
                                <FieldListItem
                                    field={child}
                                    onEdit={() => onEditField(child)}
                                    onDelete={() => onDeleteField(child.id)}
                                />
                            </SortableFieldItem>
                        ))
                    )}
                </Box>
            </SortableContext>
        </Box>
    );
}
