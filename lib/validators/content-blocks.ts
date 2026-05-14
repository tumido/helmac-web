import { z } from "zod";

const layoutSchema = z.object({
    x: z.number().int().min(0),
    y: z.number().min(0).nullable().transform((v) => v ?? 0),
    w: z.number().int().min(1).max(12),
    h: z.number().min(1),
});

const richTextBlockSchema = z.object({
    type: z.literal("richtext"),
    id: z.string().min(1),
    layout: layoutSchema,
    content: z.string(),
});

const imageBlockSchema = z.object({
    type: z.literal("image"),
    id: z.string().min(1),
    layout: layoutSchema,
    url: z.string(),
    alt: z.string(),
    caption: z.string(),
});

const dividerBlockSchema = z.object({
    type: z.literal("divider"),
    id: z.string().min(1),
    layout: layoutSchema,
    variant: z.enum(["simple", "simple-reversed", "ornate"]),
});

const cardButtonSchema = z.object({
    id: z.string().min(1),
    label: z.string(),
    href: z.string(),
    variant: z.enum(["contained", "outlined", "text"]),
});

const cardBlockSchema = z.object({
    type: z.literal("card"),
    id: z.string().min(1),
    layout: layoutSchema,
    imageUrl: z.string(),
    title: z.string(),
    text: z.string(),
    buttons: z.array(cardButtonSchema),
});

const statSuffixSchema = z.object({
    source: z.enum(["manual", "capacity", "total"]),
    text: z.string().optional(),
}).optional();

const statFieldFilterSchema = z.object({
    fieldName: z.string(),
    value: z.string(),
});

const statFilterSchema = z.object({
    statuses: z.array(z.string()).optional(),
    isPaid: z.boolean().optional(),
    fieldFilters: z.array(statFieldFilterSchema).optional(),
}).optional();

const statMetricConfigSchema = z.object({
    id: z.string().min(1),
    source: z.enum(["builtin", "field"]).optional(),
    metric: z.string(),
    aggregation: z.enum(["count", "sum", "average", "enumerate"]).optional(),
    label: z.string().optional(),
    icon: z.string().optional(),
    filter: statFilterSchema,
    fallback: z.string().optional(),
});

const statSingleBlockSchema = z.object({
    type: z.literal("stat_single"),
    id: z.string().min(1),
    layout: layoutSchema,
    source: z.enum(["builtin", "field"]).optional(),
    metric: z.string(),
    aggregation: z.enum(["count", "sum", "average", "enumerate"]).optional(),
    label: z.string().optional(),
    icon: z.string().optional(),
    suffix: statSuffixSchema,
    filter: statFilterSchema,
});

const statTableBlockSchema = z.object({
    type: z.literal("stat_table"),
    id: z.string().min(1),
    layout: layoutSchema,
    source: z.enum(["builtin", "field"]).optional(),
    title: z.string().optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    metrics: z.array(statMetricConfigSchema),
    filter: statFilterSchema,
});

const statCardsBlockSchema = z.object({
    type: z.literal("stat_cards"),
    id: z.string().min(1),
    layout: layoutSchema,
    source: z.enum(["builtin", "field"]).optional(),
    metric: z.string(),
    aggregation: z.enum(["count", "sum", "average", "enumerate"]).optional(),
    label: z.string().optional(),
    icon: z.string().optional(),
    iconMap: z.record(z.string(), z.string()).optional(),
    suffix: statSuffixSchema,
    filter: statFilterSchema,
});

const contentBlockSchema = z.union([
    richTextBlockSchema,
    imageBlockSchema,
    dividerBlockSchema,
    cardBlockSchema,
    statSingleBlockSchema,
    statTableBlockSchema,
    statCardsBlockSchema,
]);

export const contentBlocksSchema = z.array(contentBlockSchema);

export type ContentBlocksInput = z.infer<typeof contentBlocksSchema>;
