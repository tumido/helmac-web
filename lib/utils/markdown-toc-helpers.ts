import { generateSlug } from "./slugify";

export interface TocItem {
    id: string;
    text: string;
    level: 2 | 3;
}

const HEADING_RE = /^(#{2,3})\s+(.+)$/;

export function extractMarkdownToc(markdown: string): TocItem[] {
    const items: TocItem[] = [];
    const usedIds = new Map<string, number>();

    for (const line of markdown.split("\n")) {
        const match = HEADING_RE.exec(line.trim());
        if (!match) continue;

        const level = match[1].length as 2 | 3;
        const text = match[2].trim();
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
