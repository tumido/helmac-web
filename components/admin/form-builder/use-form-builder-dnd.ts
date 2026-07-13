"use client";

import { useCallback, useState } from "react";
import {
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type {
    FieldType,
    FormField,
    PricingDefinition,
} from "@/lib/types/registration-form";
import type { FlatElement } from "./form-data-adapter";
import {
    indexOfFlatId,
    makeBlankField,
    parentOfFlatId,
} from "./form-builder-helpers";

const PALETTE_PREFIX = "palette-";
const PALETTE_CONDITION = "palette-condition-";
const PALETTE_PRICING = "palette-pricing-";
const ROOT_DROPPABLE = "root-droppable";
const CONTAINER_PREFIX = "container-";

export interface DndCallbacks {
    moveElement: (
        id: string,
        toParent: string | null,
        toIndex: number
    ) => void;
    insertField: (
        field: FormField,
        parent: string | null,
        atIndex: number
    ) => void;
    insertBlock: (conditionId: string, atIndex: number) => void;
    onPaletteFieldCreated?: (field: FormField) => void;
    pricingDefinitions: PricingDefinition[];
}

export function useFormBuilderDnd(
    elements: FlatElement[],
    cb: DndCallbacks
) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const collisionDetection: CollisionDetection = useCallback((args) => {
        const pointer = pointerWithin(args);
        if (pointer.length > 0) {
            const closest = closestCenter(args);
            return closest.length > 0 ? closest : pointer;
        }
        const closest = closestCenter(args);
        return closest.length > 0 ? closest : rectIntersection(args);
    }, []);

    const onDragStart = useCallback((e: DragStartEvent) => {
        setActiveId(String(e.active.id));
    }, []);

    // Intentionally a no-op: per-frame state changes during drag-over were
    // re-rendering the entire canvas, which combined with MUI Tooltip's
    // useState-backed refs (childNode, arrowRef) and React 19 StrictMode's
    // synthetic unmount pass caused "Maximum update depth exceeded" when
    // the pointer oscillated between two drop targets. dnd-kit already
    // shifts siblings visually via CSS transforms during the drag — we
    // commit the data move only once at drop time.
    const onDragOver = useCallback(() => {
        // no-op
    }, []);

    const onDragEnd = useCallback(
        (e: DragEndEvent) => {
            const { active, over } = e;
            const activeIdStr = String(active.id);
            setActiveId(null);

            if (!over) return;
            const overIdStr = String(over.id);
            const target = resolveDropTarget(elements, overIdStr);

            if (activeIdStr.startsWith(PALETTE_CONDITION)) {
                const conditionId = activeIdStr.slice(PALETTE_CONDITION.length);
                cb.insertBlock(conditionId, target?.index ?? elements.length);
                return;
            }

            if (activeIdStr.startsWith(PALETTE_PRICING)) {
                const definitionId = activeIdStr.slice(PALETTE_PRICING.length);
                const def = cb.pricingDefinitions.find(
                    (d) => d.id === definitionId
                );
                const fieldType: FieldType =
                    def?.type === "quantity"
                        ? "pricing_quantity"
                        : def?.multiSelect
                          ? "pricing_multi_select"
                          : "pricing_select";
                const field = makeBlankField(fieldType, definitionId, def?.name);
                cb.insertField(
                    field,
                    target?.parent ?? null,
                    target?.index ?? elements.length
                );
                cb.onPaletteFieldCreated?.(field);
                return;
            }

            if (activeIdStr.startsWith(PALETTE_PREFIX)) {
                const type = activeIdStr.slice(PALETTE_PREFIX.length) as FieldType;
                const field = makeBlankField(type);
                cb.insertField(
                    field,
                    target?.parent ?? null,
                    target?.index ?? elements.length
                );
                cb.onPaletteFieldCreated?.(field);
                return;
            }

            // Existing element drag: commit the move now, at drop time.
            if (!target) return;
            if (activeIdStr === overIdStr) return;
            const moverIsBlock = isBlockId(elements, activeIdStr);
            const targetParent = moverIsBlock ? null : target.parent;
            if (isAlreadyAtSlot(elements, activeIdStr, targetParent, target.index)) {
                return;
            }
            cb.moveElement(activeIdStr, targetParent, target.index);
        },
        [elements, cb]
    );

    const onDragCancel = useCallback(() => setActiveId(null), []);

    return {
        activeId,
        sensors,
        collisionDetection,
        onDragStart,
        onDragOver,
        onDragEnd,
        onDragCancel,
    };
}

function isBlockId(elements: FlatElement[], id: string): boolean {
    return elements.some((el) => el.kind === "block" && el.data.id === id);
}

/**
 * True when `activeId` is already at the 0-based slot (`parent`, `index`).
 * `index` matches the value `resolveDropTarget` returns — i.e. the slot the
 * item will land at after the move. An item already at its own slot is a
 * no-op (matches `arrayMove(items, idx, idx)` semantics).
 */
function isAlreadyAtSlot(
    elements: FlatElement[],
    activeId: string,
    parent: string | null,
    index: number
): boolean {
    if (parent === null) {
        let n = 0;
        for (const el of elements) {
            const isRootRow =
                el.kind === "block" ||
                (el.kind === "field" && el.data.parentBlockId === null);
            if (!isRootRow) continue;
            const id =
                el.kind === "block" ? el.data.id : el.data.field.id;
            if (id === activeId) return n === index;
            n++;
        }
        return false;
    }
    let n = 0;
    for (const el of elements) {
        if (el.kind !== "field" || el.data.parentBlockId !== parent) continue;
        if (el.data.field.id === activeId) return n === index;
        n++;
    }
    return false;
}

interface DropTarget {
    parent: string | null;
    index: number;
}

function resolveDropTarget(
    elements: FlatElement[],
    overId: string
): DropTarget | null {
    if (overId === ROOT_DROPPABLE) {
        return { parent: null, index: countRootRows(elements) };
    }
    if (overId.startsWith(CONTAINER_PREFIX)) {
        const blockId = overId.slice(CONTAINER_PREFIX.length);
        return { parent: blockId, index: countChildren(elements, blockId) };
    }
    const idx = indexOfFlatId(elements, overId);
    if (idx === -1) return null;
    const parent = parentOfFlatId(elements, overId) ?? null;
    return { parent, index: indexAt(elements, overId, parent) };
}

function countRootRows(elements: FlatElement[]): number {
    let n = 0;
    for (const el of elements) {
        if (el.kind === "block") n++;
        else if (el.data.parentBlockId === null) n++;
    }
    return n;
}

function countChildren(elements: FlatElement[], blockId: string): number {
    return elements.filter(
        (el) => el.kind === "field" && el.data.parentBlockId === blockId
    ).length;
}

/**
 * 0-based slot of `overId` in its parent's child list. Returned as the drop
 * target's `index` so the active item lands AT this slot — matching
 * `arrayMove(items, fromIdx, indexOf(over))` semantics from `@dnd-kit/sortable`.
 */
function indexAt(
    elements: FlatElement[],
    overId: string,
    parent: string | null
): number {
    if (parent === null) {
        let n = 0;
        for (const el of elements) {
            if (el.kind === "block") {
                if (el.data.id === overId) return n;
                n++;
                continue;
            }
            if (el.data.parentBlockId === null) {
                if (el.data.field.id === overId) return n;
                n++;
            }
        }
        return n;
    }
    let n = 0;
    for (const el of elements) {
        if (el.kind !== "field" || el.data.parentBlockId !== parent) continue;
        if (el.data.field.id === overId) return n;
        n++;
    }
    return n;
}
