import type {
    BlockLayout,
    ContentBlock,
} from "@/lib/types/content-blocks";
import { compareByLayout } from "./constants";

interface LayoutItem {
    id: string;
    layout: BlockLayout;
}

function renumberRows<
    T extends { layout: BlockLayout },
>(items: T[]): T[] {
    const sorted = [...items].sort(compareByLayout);
    const yMap = new Map<number, number>();
    let idx = 0;
    let prevY = -1;
    for (const item of sorted) {
        if (item.layout.y !== prevY) {
            if (prevY !== -1) idx++;
            prevY = item.layout.y;
            yMap.set(item.layout.y, idx);
        }
    }
    return items.map((item) => {
        const newY = yMap.get(item.layout.y);
        if (newY === undefined || newY === item.layout.y)
            return item;
        return {
            ...item,
            layout: { ...item.layout, y: newY },
        };
    });
}

export function compact(
    items: LayoutItem[]
): LayoutItem[] {
    return renumberRows(items);
}

export function resolveCollisions(
    items: LayoutItem[],
    movedId: string
): LayoutItem[] {
    const moved = items.find(
        (i) => i.id === movedId
    );
    if (!moved) return items;

    const m = moved.layout;

    return items.map((item) => {
        if (item.id === movedId) return item;
        if (item.layout.y !== m.y) return item;

        const l = item.layout;
        if (l.x >= m.x + m.w || l.x + l.w <= m.x)
            return item;

        const movedRight = m.x + m.w;
        if (
            movedRight > l.x &&
            movedRight < l.x + l.w
        ) {
            const newW = l.x + l.w - movedRight;
            if (newW >= 1) {
                return {
                    ...item,
                    layout: {
                        ...l,
                        x: movedRight,
                        w: newW,
                    },
                };
            }
        }

        if (m.x > l.x && m.x < l.x + l.w) {
            const newW = m.x - l.x;
            if (newW >= 1) {
                return {
                    ...item,
                    layout: { ...l, w: newW },
                };
            }
        }

        return {
            ...item,
            layout: { ...l, y: l.y + 1 },
        };
    });
}

export function reorderBlock(
    blocks: ContentBlock[],
    blockId: string,
    targetY: number,
    targetX: number
): ContentBlock[] {
    const block = blocks.find(
        (b) => b.id === blockId
    );
    if (!block) return blocks;
    if (
        block.layout.y === targetY &&
        block.layout.x === targetX
    )
        return blocks;

    const others = blocks.filter(
        (b) => b.id !== blockId
    );

    const targetRowBlocks = others.filter(
        (b) => b.layout.y === targetY
    );
    const fits = targetRowBlocks.every(
        (b) =>
            targetX >= b.layout.x + b.layout.w ||
            targetX + block.layout.w <= b.layout.x
    );

    if (fits) {
        return renumberRows([
            ...others,
            {
                ...block,
                layout: {
                    ...block.layout,
                    x: targetX,
                    y: targetY,
                },
            },
        ]);
    }

    const rowYs = [
        ...new Set(
            others.map((b) => b.layout.y)
        ),
    ].sort((a, b) => a - b);
    const movingDown = block.layout.y < targetY;
    let insertIdx = rowYs.findIndex(
        (ry) => ry >= targetY
    );
    if (insertIdx === -1) {
        insertIdx = rowYs.length;
    } else if (movingDown) {
        insertIdx++;
    }

    const yMap = new Map<number, number>();
    for (let i = 0; i < rowYs.length; i++) {
        yMap.set(
            rowYs[i],
            i < insertIdx ? i : i + 1
        );
    }

    return [
        ...others.map((b) => ({
            ...b,
            layout: {
                ...b.layout,
                y:
                    yMap.get(b.layout.y) ??
                    b.layout.y,
            },
        })),
        {
            ...block,
            layout: {
                ...block.layout,
                x: targetX,
                y: insertIdx,
            },
        },
    ];
}
