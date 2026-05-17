"use client";

import type { ContentBlock } from "@/lib/types/content-blocks";
import { groupZoneId } from "./constants";
import { RichTextBlockEditor } from "./blocks/richtext-editor";
import { ImageBlockEditor } from "./blocks/image-editor";
import { DividerBlockEditor } from "./blocks/divider-editor";
import { CardBlockEditor } from "./blocks/card-editor";
import { GroupBlockEditor } from "./blocks/group-editor";
import { StatSingleBlockEditor } from "./stats/single-editor";
import { StatTableBlockEditor } from "./stats/table-editor";
import { StatCardsBlockEditor } from "./stats/cards-editor";

interface BlockContentProps {
    block: ContentBlock;
    onChange: (block: ContentBlock) => void;
    yearId?: string;
}

export function BlockContent({
    block,
    onChange,
    yearId,
}: BlockContentProps) {
    switch (block.type) {
        case "richtext":
            return (
                <RichTextBlockEditor
                    block={block}
                    onChange={onChange}
                    yearId={yearId}
                />
            );
        case "image":
            return (
                <ImageBlockEditor
                    block={block}
                    onChange={onChange}
                />
            );
        case "divider":
            return (
                <DividerBlockEditor
                    block={block}
                    onChange={onChange}
                />
            );
        case "card":
            return (
                <CardBlockEditor
                    block={block}
                    onChange={onChange}
                    yearId={yearId}
                />
            );
        case "group":
            return (
                <GroupBlockEditor
                    block={block}
                    onChange={onChange}
                    yearId={yearId}
                    groupZoneId={groupZoneId}
                />
            );
        case "stat_single":
            return (
                <StatSingleBlockEditor
                    block={block}
                    onChange={onChange}
                    yearId={yearId}
                />
            );
        case "stat_table":
            return (
                <StatTableBlockEditor
                    block={block}
                    onChange={onChange}
                    yearId={yearId}
                />
            );
        case "stat_cards":
            return (
                <StatCardsBlockEditor
                    block={block}
                    onChange={onChange}
                    yearId={yearId}
                />
            );
    }
}
