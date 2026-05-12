import { generateSlug } from "./slugify";

export interface TocItem {
    id: string;
    text: string;
    level: 2 | 3;
}

const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const HTML_HEADING_RE = /^<h([23])\b[^>]*>(.*?)<\/h\1>$/i;

function stripInlineMarkdown(text: string): string {
    return (
        text
            .replace(/<[^>]+>/g, "")
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/__(.+?)__/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/_(.+?)_/g, "$1")
            .replace(/~~(.+?)~~/g, "$1")
            .replace(/`(.+?)`/g, "$1")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
    );
}

export function extractMarkdownToc(markdown: string): TocItem[] {
    const items: TocItem[] = [];
    const usedIds = new Map<string, number>();

    for (const line of markdown.split("\n")) {
        const trimmed = line.trim();

        let level: 2 | 3;
        let rawText: string;

        const mdMatch = HEADING_RE.exec(trimmed);
        if (mdMatch) {
            level = mdMatch[1].length as 2 | 3;
            rawText = mdMatch[2];
        } else {
            const htmlMatch = HTML_HEADING_RE.exec(trimmed);
            if (!htmlMatch) continue;
            level = Number(htmlMatch[1]) as 2 | 3;
            rawText = htmlMatch[2];
        }

        const text = stripInlineMarkdown(rawText.trim());
        if (!text) continue;

        const baseId = generateSlug(text) || `heading-${level}`;

        const count = usedIds.get(baseId) ?? 0;
        usedIds.set(baseId, count + 1);

        const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

        items.push({ id, text, level });
    }

    return items;
}

export function buildTocIdMap(
    items: TocItem[],
): Map<string, string> {
    const map = new Map<string, string>();
    for (const item of items) {
        map.set(item.text, item.id);
    }
    return map;
}
