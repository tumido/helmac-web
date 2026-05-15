import type {
    BlockLayout,
    ContentBlock,
    GroupBlock,
} from "@/lib/types/content-blocks";

export const GRID_COLUMNS = 12;
export const ROW_HEIGHT = 30;
export const GRID_GAP = 12;

export const GRID_ROOT = "grid:root";
const GRID_GROUP_PREFIX = "grid:group:";

export function groupZoneId(blockId: string) {
    return `${GRID_GROUP_PREFIX}${blockId}`;
}

export function parseGroupZoneId(
    zoneId: string
): string | null {
    if (zoneId.startsWith(GRID_GROUP_PREFIX)) {
        return zoneId.slice(
            GRID_GROUP_PREFIX.length
        );
    }
    return null;
}

export function isLayoutChanged(
    a: BlockLayout,
    b: BlockLayout
): boolean {
    return (
        a.w !== b.w ||
        a.h !== b.h ||
        a.x !== b.x ||
        a.y !== b.y
    );
}

export function isGroupBlock(
    b: ContentBlock
): b is GroupBlock {
    return b.type === "group";
}

export function compareByLayout(
    a: { layout: BlockLayout },
    b: { layout: BlockLayout }
): number {
    if (a.layout.y !== b.layout.y)
        return a.layout.y - b.layout.y;
    return a.layout.x - b.layout.x;
}
