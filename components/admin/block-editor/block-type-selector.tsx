"use client";

import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Popover,
} from "@mui/material";
import type { ContentBlockType } from "@/lib/types/content-blocks";
import { BLOCK_TYPES } from "./block-meta";

interface BlockTypeSelectorProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onSelect: (type: ContentBlockType) => void;
}

export function BlockTypeSelector({
    anchorEl,
    onClose,
    onSelect,
}: BlockTypeSelectorProps) {
    return (
        <Popover
            open={!!anchorEl}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <List dense sx={{ minWidth: 180 }}>
                {BLOCK_TYPES.map(({ type, label, icon }) => (
                    <ListItemButton
                        key={type}
                        onClick={() => {
                            onSelect(type);
                            onClose();
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            {icon}
                        </ListItemIcon>
                        <ListItemText primary={label} />
                    </ListItemButton>
                ))}
            </List>
        </Popover>
    );
}
