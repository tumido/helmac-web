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

const contentBlockSchema = z.union([
    richTextBlockSchema,
    imageBlockSchema,
    dividerBlockSchema,
    cardBlockSchema,
]);

export const contentBlocksSchema = z.array(contentBlockSchema);

export type ContentBlocksInput = z.infer<typeof contentBlocksSchema>;
