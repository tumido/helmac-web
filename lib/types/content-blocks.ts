export interface BlockLayout {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface RichTextBlock {
    type: "richtext";
    id: string;
    layout: BlockLayout;
    content: string;
}

export interface ImageBlock {
    type: "image";
    id: string;
    layout: BlockLayout;
    url: string;
    alt: string;
    caption: string;
}

export type DividerVariant = "simple" | "ornate";

export interface DividerBlock {
    type: "divider";
    id: string;
    layout: BlockLayout;
    variant: DividerVariant;
}

export interface CardBlock {
    type: "card";
    id: string;
    layout: BlockLayout;
    imageUrl: string;
    title: string;
    text: string;
    buttonLabel: string;
    buttonUrl: string;
}

export type ContentBlock =
    | RichTextBlock
    | ImageBlock
    | DividerBlock
    | CardBlock;

export type ContentBlockType = ContentBlock["type"];

export function isRichTextBlock(block: ContentBlock): block is RichTextBlock {
    return block.type === "richtext";
}

export function isImageBlock(block: ContentBlock): block is ImageBlock {
    return block.type === "image";
}

export function isDividerBlock(block: ContentBlock): block is DividerBlock {
    return block.type === "divider";
}

export function createBlock(type: ContentBlockType): ContentBlock {
    const id = crypto.randomUUID();

    switch (type) {
        case "richtext":
            return {
                type: "richtext",
                id,
                layout: { x: 0, y: Infinity, w: 12, h: 10 },
                content: "",
            };
        case "image":
            return {
                type: "image",
                id,
                layout: { x: 0, y: Infinity, w: 6, h: 10 },
                url: "",
                alt: "",
                caption: "",
            };
        case "divider":
            return {
                type: "divider",
                id,
                layout: { x: 0, y: Infinity, w: 12, h: 2 },
                variant: "simple",
            };
        case "card":
            return {
                type: "card",
                id,
                layout: { x: 0, y: Infinity, w: 4, h: 12 },
                imageUrl: "",
                title: "",
                text: "",
                buttonLabel: "",
                buttonUrl: "",
            };
    }
}

export function blocksToMarkdown(blocks: ContentBlock[]): string {
    const sorted = [...blocks].sort((a, b) => {
        if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
        return a.layout.x - b.layout.x;
    });

    const parts: string[] = [];

    for (const block of sorted) {
        if (block.type === "richtext") {
            parts.push(block.content);
        }
    }

    return parts.join("\n\n");
}
