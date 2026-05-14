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

export type DividerVariant = "simple" | "simple-reversed" | "ornate";

export interface DividerBlock {
    type: "divider";
    id: string;
    layout: BlockLayout;
    variant: DividerVariant;
}

export type CardButtonVariant = "contained" | "outlined" | "text";

export interface CardButton {
    id: string;
    label: string;
    href: string;
    variant: CardButtonVariant;
}

export interface CardBlock {
    type: "card";
    id: string;
    layout: BlockLayout;
    imageUrl: string;
    title: string;
    text: string;
    buttons: CardButton[];
}

export type BuiltinMetric =
    | "registrations"
    | "people"
    | "paid_total"
    | "unpaid_total"
    | "confirmed"
    | "pending"
    | "waitlist";

export type FieldAggregation =
    | "count"
    | "sum"
    | "average"
    | "enumerate";

export interface StatMetricConfig {
    id: string;
    source?: "builtin" | "field";
    metric: string;
    aggregation?: FieldAggregation;
    label?: string;
    icon?: string;
    filter?: StatFilter;
}

export type StatSuffixSource = "manual" | "capacity" | "total";

export interface StatSuffix {
    source: StatSuffixSource;
    text?: string;
}

export interface StatFieldFilter {
    fieldName: string;
    value: string;
}

export interface StatFilter {
    statuses?: string[];
    isPaid?: boolean;
    fieldFilters?: StatFieldFilter[];
}

export interface StatSingleBlock {
    type: "stat_single";
    id: string;
    layout: BlockLayout;
    source?: "builtin" | "field";
    metric: string;
    aggregation?: FieldAggregation;
    label?: string;
    icon?: string;
    suffix?: StatSuffix;
    filter?: StatFilter;
}

export type StatTableAlign = "left" | "center" | "right";

export interface StatTableBlock {
    type: "stat_table";
    id: string;
    layout: BlockLayout;
    source?: "builtin" | "field";
    title?: string;
    align?: StatTableAlign;
    metrics: StatMetricConfig[];
    filter?: StatFilter;
}

export interface StatCardsBlock {
    type: "stat_cards";
    id: string;
    layout: BlockLayout;
    source?: "builtin" | "field";
    metric: string;
    aggregation?: FieldAggregation;
    label?: string;
    icon?: string;
    iconMap?: Record<string, string>;
    suffix?: StatSuffix;
    filter?: StatFilter;
}

export const BUILTIN_METRIC_LABELS: Record<BuiltinMetric, string> = {
    registrations: "Registrací",
    people: "Účastníků",
    paid_total: "Zaplaceno",
    unpaid_total: "Nezaplaceno",
    confirmed: "Potvrzených",
    pending: "Čekajících",
    waitlist: "Na čekací listině",
};

export const BUILTIN_CURRENCY_METRICS: BuiltinMetric[] = [
    "paid_total",
    "unpaid_total",
];

export const FIELD_AGGREGATION_LABELS: Record<
    FieldAggregation,
    string
> = {
    count: "Počet",
    sum: "Součet",
    average: "Průměr",
    enumerate: "Výpis",
};

export function isBuiltinMetric(
    key: string
): key is BuiltinMetric {
    return key in BUILTIN_METRIC_LABELS;
}

export type ContentBlock =
    | RichTextBlock
    | ImageBlock
    | DividerBlock
    | CardBlock
    | StatSingleBlock
    | StatTableBlock
    | StatCardsBlock;

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
                layout: { x: 0, y: Infinity, w: 12, h: 4 },
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
                buttons: [],
            };
        case "stat_single":
            return {
                type: "stat_single",
                id,
                layout: { x: 0, y: Infinity, w: 4, h: 6 },
                source: "builtin" as const,
                metric: "registrations",
            };
        case "stat_table":
            return {
                type: "stat_table",
                id,
                layout: { x: 0, y: Infinity, w: 6, h: 8 },
                metrics: [
                    { id: crypto.randomUUID(), source: "builtin" as const, metric: "registrations" },
                    { id: crypto.randomUUID(), source: "builtin" as const, metric: "people" },
                ],
            };
        case "stat_cards":
            return {
                type: "stat_cards",
                id,
                layout: { x: 0, y: Infinity, w: 12, h: 6 },
                source: "builtin" as const,
                metric: "registrations",
            };
    }
}

interface LegacyCardBlock {
    type: "card";
    id: string;
    layout: BlockLayout;
    imageUrl: string;
    title: string;
    text: string;
    buttonLabel?: string;
    buttonUrl?: string;
    buttons?: CardButton[];
}

export function normalizeBlocks(blocks: unknown[] | unknown): ContentBlock[] {
    if (!Array.isArray(blocks)) return [];
    return blocks.map((block) => {
        const b = block as Record<string, unknown>;
        if (b.type === "card" && !Array.isArray(b.buttons)) {
            const legacy = b as unknown as LegacyCardBlock;
            const buttons: CardButton[] = [];
            if (legacy.buttonLabel && legacy.buttonUrl) {
                buttons.push({
                    id: crypto.randomUUID(),
                    label: legacy.buttonLabel,
                    href: legacy.buttonUrl,
                    variant: "contained",
                });
            }
            return {
                type: legacy.type,
                id: legacy.id,
                layout: legacy.layout,
                imageUrl: legacy.imageUrl,
                title: legacy.title,
                text: legacy.text,
                buttons,
            } satisfies CardBlock;
        }
        return block as ContentBlock;
    });
}

export function hasStatBlocks(blocks: unknown[]): boolean {
    return blocks.some((b) => {
        const block = b as Record<string, unknown>;
        return (
            block.type === "stat_single" ||
            block.type === "stat_table" ||
            block.type === "stat_cards"
        );
    });
}

export function extractStatBlocks(
    blocks: unknown[]
): (StatSingleBlock | StatTableBlock | StatCardsBlock)[] {
    return blocks.filter((b) => {
        const block = b as Record<string, unknown>;
        return (
            block.type === "stat_single" ||
            block.type === "stat_table" ||
            block.type === "stat_cards"
        );
    }) as (StatSingleBlock | StatTableBlock | StatCardsBlock)[];
}

export function blocksToMarkdown(blocks: ContentBlock[]): string {
    const sorted = [...blocks].sort((a, b) => {
        const ay = a.layout?.y ?? 0;
        const by = b.layout?.y ?? 0;
        if (ay !== by) return ay - by;
        return (a.layout?.x ?? 0) - (b.layout?.x ?? 0);
    });

    const parts: string[] = [];

    for (const block of sorted) {
        if (block.type === "richtext") {
            parts.push(block.content);
        }
    }

    return parts.join("\n\n");
}
