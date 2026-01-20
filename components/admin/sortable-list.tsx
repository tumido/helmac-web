"use client";

import { useState } from "react";
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
import { Box, Paper } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
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
        <Paper
            ref={setNodeRef}
            style={style}
            sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                "&:last-child": { mb: 0 },
            }}
            elevation={isDragging ? 4 : 1}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1.5,
                    cursor: "grab",
                    color: "text.disabled",
                    "&:hover": {
                        color: "text.secondary",
                    },
                    "&:active": {
                        cursor: "grabbing",
                    },
                }}
            >
                <DragIndicator />
            </Box>
            <Box sx={{ flex: 1, overflow: "hidden" }}>{children}</Box>
        </Paper>
    );
}

interface SortableListProps<T> {
    items: T[];
    getId: (item: T) => string;
    renderItem: (item: T) => React.ReactNode;
    onReorder: (newOrder: string[]) => void | Promise<void>;
}

export function SortableList<T>({
    items,
    getId,
    renderItem,
    onReorder,
}: SortableListProps<T>) {
    const [localItems, setLocalItems] = useState(items);

    // Sync local items with props
    if (items !== localItems && items.length !== localItems.length) {
        setLocalItems(items);
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localItems.findIndex((item) => getId(item) === active.id);
            const newIndex = localItems.findIndex((item) => getId(item) === over.id);

            const newItems = arrayMove(localItems, oldIndex, newIndex);
            setLocalItems(newItems);

            // Call the reorder callback with new order
            const newOrder = newItems.map(getId);
            await onReorder(newOrder);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={localItems.map(getId)}
                strategy={verticalListSortingStrategy}
            >
                <Box>
                    {localItems.map((item) => (
                        <SortableItem key={getId(item)} id={getId(item)}>
                            {renderItem(item)}
                        </SortableItem>
                    ))}
                </Box>
            </SortableContext>
        </DndContext>
    );
}
