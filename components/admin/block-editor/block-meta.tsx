"use client";

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

interface BlockMeta {
    type: ContentBlockType;
    label: string;
    icon: React.ReactNode;
}

export const BLOCK_TYPES: BlockMeta[] = [
    { type: "richtext", label: "Text", icon: <TextFields /> },
    { type: "image", label: "Obrázek", icon: <ImageIcon /> },
    { type: "divider", label: "Oddělovač", icon: <HorizontalRule /> },
    { type: "card", label: "Karta", icon: <ViewAgenda /> },
    { type: "stat_single", label: "Statistika", icon: <Pin /> },
    {
        type: "stat_table",
        label: "Tabulka statistik",
        icon: <TableChart />,
    },
    {
        type: "stat_cards",
        label: "Karty statistik",
        icon: <Dashboard />,
    },
];

export const BLOCK_META: Record<ContentBlockType, BlockMeta> =
    Object.fromEntries(
        BLOCK_TYPES.map((m) => [m.type, m])
    ) as Record<ContentBlockType, BlockMeta>;
