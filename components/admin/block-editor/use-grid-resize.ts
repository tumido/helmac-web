"use client";

import { useCallback, useRef } from "react";
import type { BlockLayout } from "@/lib/types/content-blocks";
import { GRID_COLUMNS } from "./constants";

type ResizeDirection = "e" | "w";

interface UseGridResizeOptions {
    layout: BlockLayout;
    getCellWidth: () => number;
    onChange: (layout: BlockLayout) => void;
}

export function useGridResize({
    layout,
    getCellWidth,
    onChange,
}: UseGridResizeOptions) {
    const layoutRef = useRef(layout);
    layoutRef.current = layout; // eslint-disable-line react-hooks/refs

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange; // eslint-disable-line react-hooks/refs

    const startRef = useRef<{
        px: number;
        w: number;
        x: number;
        dir: ResizeDirection;
        cellWidth: number;
    } | null>(null);
    const lastEmitted = useRef<{
        x: number;
        w: number;
    } | null>(null);

    const handlePointerDown = useCallback(
        (
            dir: ResizeDirection,
            e: React.PointerEvent
        ) => {
            e.preventDefault();
            e.stopPropagation();
            (
                e.target as HTMLElement
            ).setPointerCapture(e.pointerId);

            const l = layoutRef.current;
            startRef.current = {
                px: e.clientX,
                w: l.w,
                x: l.x,
                dir,
                cellWidth: getCellWidth(),
            };
            lastEmitted.current = null;
        },
        [getCellWidth]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            const s = startRef.current;
            if (!s) return;

            const dx = e.clientX - s.px;
            let x = s.x;
            let w = s.w;

            if (s.dir === "e") {
                w = Math.max(
                    1,
                    Math.min(
                        GRID_COLUMNS - s.x,
                        s.w +
                            Math.round(
                                dx / s.cellWidth
                            )
                    )
                );
            }

            if (s.dir === "w") {
                const delta = Math.round(
                    dx / s.cellWidth
                );
                const newX = Math.max(
                    0,
                    Math.min(
                        s.x + s.w - 1,
                        s.x + delta
                    )
                );
                w = s.x + s.w - newX;
                x = newX;
            }

            const prev = lastEmitted.current ?? {
                x: s.x,
                w: s.w,
            };
            if (x !== prev.x || w !== prev.w) {
                lastEmitted.current = { x, w };
                onChangeRef.current({
                    ...layoutRef.current,
                    x,
                    w,
                });
            }
        },
        []
    );

    const handlePointerUp = useCallback(() => {
        startRef.current = null;
        lastEmitted.current = null;
    }, []);

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    };
}
