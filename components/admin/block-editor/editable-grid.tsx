"use client";

import { useCallback, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import GridLayout, { type Layout } from "react-grid-layout";
import { useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { BlockLayout } from "@/lib/types/content-blocks";

const ROW_HEIGHT = 30;

interface EditableGridProps {
    items: { id: string; layout: BlockLayout }[];
    onLayoutChange: (layouts: Record<string, BlockLayout>) => void;
    isUpdatingRef: React.RefObject<boolean>;
    children: React.ReactNode;
}

function itemsToLayout(items: { id: string; layout: BlockLayout }[]): Layout {
    return items.map((item) => ({
        i: item.id,
        x: item.layout?.x ?? 0,
        y: item.layout?.y ?? 0,
        w: item.layout?.w ?? 12,
        h: item.layout?.h ?? 2,
        minW: 1,
        minH: 1,
    }));
}

function layoutToRecord(layout: Layout): Record<string, BlockLayout> {
    const layouts: Record<string, BlockLayout> = {};
    for (const item of layout) {
        layouts[item.i] = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
        };
    }
    return layouts;
}

export function EditableGrid({
    items,
    onLayoutChange,
    isUpdatingRef,
    children,
}: EditableGridProps) {
    const { width, containerRef, mounted } = useContainerWidth({
        measureBeforeMount: true,
        initialWidth: 800,
    });

    const interactingRef = useRef(false);
    const pendingLayoutRef = useRef<Layout | null>(null);

    const layout = useMemo(() => itemsToLayout(items), [items]);

    const handleLayoutChange = useCallback(
        (newLayout: Layout) => {
            if (isUpdatingRef.current) return;
            if (interactingRef.current) {
                pendingLayoutRef.current = newLayout;
                return;
            }
            onLayoutChange(layoutToRecord(newLayout));
        },
        [isUpdatingRef, onLayoutChange]
    );

    const handleInteractionStart = useCallback(() => {
        interactingRef.current = true;
        pendingLayoutRef.current = null;
    }, []);

    const handleInteractionStop = useCallback(() => {
        interactingRef.current = false;
        if (pendingLayoutRef.current) {
            onLayoutChange(layoutToRecord(pendingLayoutRef.current));
            pendingLayoutRef.current = null;
        }
    }, [onLayoutChange]);

    return (
        <Box
            ref={containerRef}
            sx={{
                "& .react-grid-item.resizing": {
                    "& > *": { visibility: "hidden" },
                    transition: "none !important",
                },
                "& .react-grid-item.react-grid-placeholder":
                    {
                        background: "none !important",
                        border: "2px dashed",
                        borderColor: "primary.main",
                        borderRadius: 1,
                        opacity: "1 !important",
                    },
            }}
        >
            {mounted && (
                <GridLayout
                    layout={layout}
                    width={width}
                    onLayoutChange={handleLayoutChange}
                    onDragStart={handleInteractionStart}
                    onDragStop={handleInteractionStop}
                    onResizeStart={handleInteractionStart}
                    onResizeStop={handleInteractionStop}
                    gridConfig={{
                        cols: 12,
                        rowHeight: ROW_HEIGHT,
                    }}
                    dragConfig={{
                        handle: ".block-drag-handle",
                    }}
                    resizeConfig={{
                        handles: ["se", "e", "s"],
                    }}
                >
                    {children}
                </GridLayout>
            )}
        </Box>
    );
}
