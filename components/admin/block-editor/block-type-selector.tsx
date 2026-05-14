"use client";

import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Popover,
} from "@mui/material";
import {
    TextFields,
    Image as ImageIcon,
    HorizontalRule,
    ViewAgenda,
    Pin,
    TableChart,
    Dashboard,
} from "@mui/icons-material";
import type { ContentBlockType } from "@/lib/types/content-blocks";

const BLOCK_TYPES: {
    type: ContentBlockType;
    label: string;
    icon: React.ReactNode;
}[] = [
    { type: "richtext", label: "Text", icon: <TextFields /> },
    { type: "image", label: "Obrázek", icon: <ImageIcon /> },
    { type: "divider", label: "Oddělovač", icon: <HorizontalRule /> },
    { type: "card", label: "Karta", icon: <ViewAgenda /> },
    { type: "stat_single", label: "Statistika", icon: <Pin /> },
    { type: "stat_table", label: "Tabulka statistik", icon: <TableChart /> },
    { type: "stat_cards", label: "Karty statistik", icon: <Dashboard /> },
];

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
