"use client";

import { useState, useId } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Divider } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { builderPalette as p } from "@/components/admin/email-builder/palette";

type SortableVariant = "standalone" | "flat";

interface SortableItemProps {
    id: string;
    variant: SortableVariant;
    children: React.ReactNode;
}

function SortableItem({ id, variant, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                display: "flex",
                alignItems: "center",
                transition: "box-shadow 140ms ease",
                ...(variant === "standalone" && {
                    mb: "4px",
                    "&:last-child": { mb: 0 },
                    backgroundColor: p.surface,
                    border: `1px solid ${p.line}`,
                    borderRadius: "10px",
                }),
                ...(isDragging && {
                    boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
                    ...(variant === "flat" && {
                        backgroundColor: "background.paper",
                    }),
                }),
            }}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1,
                    cursor: "grab",
                    color: p.ink3,
                    "&:hover": {
                        color: p.ink2,
                    },
                    "&:active": {
                        cursor: "grabbing",
                    },
                }}
            >
                <DragIndicator sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
                {children}
            </Box>
        </Box>
    );
}

interface SortableListProps<T> {
    items: T[];
    getId: (item: T) => string;
    renderItem: (item: T) => React.ReactNode;
    onReorder: (newOrder: string[]) => void | Promise<void>;
    variant?: SortableVariant;
}

export function SortableList<T>({
    items,
    getId,
    renderItem,
    onReorder,
    variant = "standalone",
}: SortableListProps<T>) {
    const dndId = useId();
    const [localItems, setLocalItems] = useState(items);

    if (
        items !== localItems &&
        items.length !== localItems.length
    ) {
        setLocalItems(items);
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter:
                sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (
        event: DragEndEvent
    ) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localItems.findIndex(
                (item) => getId(item) === active.id
            );
            const newIndex = localItems.findIndex(
                (item) => getId(item) === over.id
            );

            const newItems = arrayMove(
                localItems,
                oldIndex,
                newIndex
            );
            setLocalItems(newItems);

            const newOrder = newItems.map(getId);
            await onReorder(newOrder);
        }
    };

    return (
        <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={localItems.map(getId)}
                strategy={verticalListSortingStrategy}
            >
                <Box>
                    {localItems.map((item, index) => (
                        <Box key={getId(item)}>
                            {variant === "flat" &&
                                index > 0 && <Divider />}
                            <SortableItem
                                id={getId(item)}
                                variant={variant}
                            >
                                {renderItem(item)}
                            </SortableItem>
                        </Box>
                    ))}
                </Box>
            </SortableContext>
        </DndContext>
    );
}
