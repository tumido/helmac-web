import { generateSlug } from "./slugify";

export interface TocItem {
    id: string;
    text: string;
    level: 2 | 3;
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtmlTags(html: string): string {
    return decodeHtmlEntities(html.replace(/<[^>]*>/g, "").trim());
}

/**
 * Parses HTML content and adds unique `id` attributes to h2/h3 headings.
 * Returns the modified HTML string.
 */
export function injectHeadingIds(html: string): string {
    const usedIds = new Map<string, number>();

    return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi, (match, level, attrs, inner) => {
        const text = stripHtmlTags(inner);
        const baseId = generateSlug(text) || `heading-${level}`;

        const count = usedIds.get(baseId) ?? 0;
        usedIds.set(baseId, count + 1);

        const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

        // Preserve existing attributes, add id
        const cleanAttrs = attrs.replace(/\s*id="[^"]*"/g, "");
        return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
    });
}

/**
 * Extracts TOC items from HTML that has already been processed by `injectHeadingIds`.
 */
export function extractTocItems(html: string): TocItem[] {
    const items: TocItem[] = [];
    const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h[23]>/gi;

    let match;
    while ((match = regex.exec(html)) !== null) {
        items.push({
            level: parseInt(match[1]) as 2 | 3,
            id: match[2],
            text: stripHtmlTags(match[3]),
        });
    }

    return items;
}
