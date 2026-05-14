"use client";

import { memo } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { AccountTree, Delete } from "@mui/icons-material";
import type { FormCondition } from "@/lib/types/registration-form";

interface Props {
    blockId: string;
    condition: FormCondition | undefined;
    onDeleteBlock: (blockId: string) => void;
}

function BlockHeaderRowImpl({ blockId, condition, onDeleteBlock }: Props) {
    // Bg + left rail are owned by the outer SortableFieldItem (so they tile
    // continuously with the block's children). This row only renders header
    // content: icon, condition label, delete action.
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                flex: 1,
            }}
        >
            <AccountTree fontSize="small" color="info" />
            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                Podmínka: {condition?.name ?? "(nepojmenovaná)"}
            </Typography>
            <Tooltip title="Smazat blok">
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteBlock(blockId)}
                >
                    <Delete fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export const BlockHeaderRow = memo(BlockHeaderRowImpl);
