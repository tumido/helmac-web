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
    excludeTypes?: ContentBlockType[];
}

export function BlockTypeSelector({
    anchorEl,
    onClose,
    onSelect,
    excludeTypes,
}: BlockTypeSelectorProps) {
    const types = excludeTypes
        ? BLOCK_TYPES.filter(
              (t) => !excludeTypes.includes(t.type)
          )
        : BLOCK_TYPES;

    return (
        <Popover
            open={!!anchorEl}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "center",
            }}
        >
            <List dense sx={{ minWidth: 180 }}>
                {types.map(({ type, label, icon }) => (
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
