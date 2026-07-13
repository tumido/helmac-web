"use client";

import { useCallback, useReducer } from "react";
import type {
    CapacityLimit,
    FormCondition,
    FormField,
    InfoStatsConfig,
    InputField,
    PricingDefinition,
    RegistrationFormData,
} from "@/lib/types/registration-form";
import {
    flatToNested,
    nestedToFlat,
    type FlatElement,
} from "./form-data-adapter";
import {
    indexOfFlatId,
    parentOfFlatId,
    patchInputFieldInFlat,
    removeBlockKeepChildren,
    removeFieldFromFlat,
    updateFieldInFlat,
} from "./form-builder-helpers";

interface State {
    elements: FlatElement[];
    conditions: FormCondition[];
    pricingDefinitions: PricingDefinition[];
    priceTiers: string[];
    capacityLimits: CapacityLimit[];
    showOptionCounts: string[];
    infoStatsConfig: InfoStatsConfig | undefined;
}

export type FormBuilderAction =
    | { type: "addElement"; element: FlatElement }
    | { type: "removeField"; fieldId: string }
    | { type: "removeBlock"; blockId: string }
    | { type: "updateField"; field: FormField }
    | { type: "patchField"; fieldId: string; patch: Partial<InputField> }
    | {
          type: "moveElement";
          id: string;
          toParentBlockId: string | null;
          toIndex: number;
      }
    | { type: "setConditions"; conditions: FormCondition[] }
    | { type: "addCondition"; condition: FormCondition; afterFieldId: string }
    | { type: "setPricingDefinitions"; defs: PricingDefinition[] }
    | { type: "setPriceTiers"; tiers: string[] }
    | { type: "reset"; data: RegistrationFormData };

export function formBuilderReducer(
    state: State,
    action: FormBuilderAction
): State {
    switch (action.type) {
        case "addElement":
            return { ...state, elements: [...state.elements, action.element] };
        case "removeField":
            return {
                ...state,
                elements: removeFieldFromFlat(state.elements, action.fieldId),
            };
        case "removeBlock":
            return {
                ...state,
                elements: removeBlockKeepChildren(
                    state.elements,
                    action.blockId
                ),
            };
        case "updateField":
            return {
                ...state,
                elements: updateFieldInFlat(state.elements, action.field),
            };
        case "patchField":
            return {
                ...state,
                elements: patchInputFieldInFlat(
                    state.elements,
                    action.fieldId,
                    action.patch
                ),
            };
        case "moveElement":
            return { ...state, elements: applyMove(state.elements, action) };
        case "setConditions":
            return { ...state, conditions: action.conditions };
        case "addCondition":
            return applyAddCondition(
                state,
                action.condition,
                action.afterFieldId
            );
        case "setPricingDefinitions":
            return { ...state, pricingDefinitions: action.defs };
        case "setPriceTiers":
            return { ...state, priceTiers: action.tiers };
        case "reset":
            return initFromData(action.data);
    }
}

export function applyMove(
    elements: FlatElement[],
    move: {
        id: string;
        toParentBlockId: string | null;
        toIndex: number;
    }
): FlatElement[] {
    const fromIdx = indexOfFlatId(elements, move.id);
    if (fromIdx === -1) return elements;
    const moving = elements[fromIdx];

    if (moving.kind === "block" && move.toParentBlockId !== null) {
        // Blocks always sit at root; reject illegal target.
        return elements;
    }

    // No-op short-circuit: if the move would land the item back exactly where
    // it already is (same parent + same position-in-parent), return the same
    // reference so React skips the commit and re-render.
    if (isAlreadyAtTarget(elements, moving, move)) {
        return elements;
    }

    let run: FlatElement[];
    let rest: FlatElement[];

    if (moving.kind === "block") {
        const childIds = new Set<string>();
        for (const el of elements) {
            if (
                el.kind === "field" &&
                el.data.parentBlockId === moving.data.id
            ) {
                childIds.add(el.data.field.id);
            }
        }
        run = [
            moving,
            ...elements.filter(
                (el) => el.kind === "field" && childIds.has(el.data.field.id)
            ),
        ];
        rest = elements.filter(
            (el) =>
                !(el.kind === "block" && el.data.id === moving.data.id) &&
                !(el.kind === "field" && childIds.has(el.data.field.id))
        );
    } else {
        run = [
            {
                ...moving,
                data: { ...moving.data, parentBlockId: move.toParentBlockId },
            },
        ];
        rest = elements.filter((_, i) => i !== fromIdx);
    }

    const insertAt = computeInsertIndex(rest, move.toParentBlockId, move.toIndex);
    return [...rest.slice(0, insertAt), ...run, ...rest.slice(insertAt)];
}

/** True when the requested move would leave the item exactly where it is. */
function isAlreadyAtTarget(
    elements: FlatElement[],
    moving: FlatElement,
    move: { id: string; toParentBlockId: string | null; toIndex: number }
): boolean {
    if (moving.kind === "field") {
        if (moving.data.parentBlockId !== move.toParentBlockId) return false;
        // Find index-in-parent for the moving field.
        let n = 0;
        for (const el of elements) {
            if (el.kind !== "field") continue;
            if (el.data.parentBlockId !== move.toParentBlockId) continue;
            if (el.data.field.id === move.id) {
                return n === move.toIndex;
            }
            n++;
        }
        return false;
    }
    // Block: target is always root; find its root-row index.
    if (move.toParentBlockId !== null) return false;
    let n = 0;
    for (const el of elements) {
        const isRootRow =
            el.kind === "block" ||
            (el.kind === "field" && el.data.parentBlockId === null);
        if (!isRootRow) continue;
        if (el.kind === "block" && el.data.id === move.id) {
            return n === move.toIndex;
        }
        n++;
    }
    return false;
}

/** Translate (parent, child-index) coordinates into a position in the flat array. */
function computeInsertIndex(
    rest: FlatElement[],
    toParentBlockId: string | null,
    toIndex: number
): number {
    if (toParentBlockId === null) {
        // Walk root rows; insert position is just before the toIndex-th root row.
        // A block's children belong to that block's "row" — skip over them when
        // counting so an insert at root index N never lands inside a child run.
        if (toIndex <= 0) return 0;
        let rootCount = 0;
        let i = 0;
        while (i < rest.length) {
            const el = rest[i];
            if (el.kind === "block") {
                rootCount++;
                i++;
                // Skip the block's children before considering the next root slot.
                while (
                    i < rest.length &&
                    rest[i].kind === "field" &&
                    (rest[i] as Extract<FlatElement, { kind: "field" }>).data
                        .parentBlockId === el.data.id
                ) {
                    i++;
                }
                if (rootCount === toIndex) return i;
                continue;
            }
            // Root-level field.
            if (el.data.parentBlockId === null) {
                rootCount++;
                i++;
                if (rootCount === toIndex) return i;
                continue;
            }
            // Stray child whose parent block is gone — treat as root for safety.
            rootCount++;
            i++;
            if (rootCount === toIndex) return i;
        }
        return rest.length;
    }
    const blockIdx = rest.findIndex(
        (el) => el.kind === "block" && el.data.id === toParentBlockId
    );
    if (blockIdx === -1) return rest.length;
    let childCount = 0;
    for (let i = blockIdx + 1; i < rest.length; i++) {
        const el = rest[i];
        if (el.kind === "field" && el.data.parentBlockId === toParentBlockId) {
            if (childCount === toIndex) return i;
            childCount++;
            continue;
        }
        return i;
    }
    return rest.length;
}

function applyAddCondition(
    state: State,
    condition: FormCondition,
    afterFieldId: string
): State {
    const conditions = [...state.conditions, condition];
    const newBlock: FlatElement = {
        kind: "block",
        data: {
            type: "condition",
            id: crypto.randomUUID(),
            conditionId: condition.id,
        },
    };
    const idx = indexOfFlatId(state.elements, afterFieldId);
    if (idx === -1) {
        return {
            ...state,
            conditions,
            elements: [...state.elements, newBlock],
        };
    }
    const parent = parentOfFlatId(state.elements, afterFieldId);
    let insertAt = idx + 1;
    if (parent != null) {
        // Source field sits inside a block — place new block after that block's whole run.
        insertAt = state.elements.length;
        for (let i = idx + 1; i < state.elements.length; i++) {
            const el = state.elements[i];
            if (el.kind === "field" && el.data.parentBlockId === parent) {
                continue;
            }
            insertAt = i;
            break;
        }
    }
    const next = [...state.elements];
    next.splice(insertAt, 0, newBlock);
    return { ...state, conditions, elements: next };
}

export function initFromData(d: RegistrationFormData): State {
    return {
        elements: nestedToFlat(d.fields),
        conditions: d.conditions,
        pricingDefinitions: d.pricingDefinitions ?? [],
        priceTiers: d.priceTiers ?? [],
        capacityLimits: d.capacityLimits ?? [],
        showOptionCounts: d.showOptionCounts ?? [],
        infoStatsConfig: d.infoStatsConfig,
    };
}

export function useFormBuilderState(initial: RegistrationFormData) {
    const [state, dispatch] = useReducer(
        formBuilderReducer,
        initial,
        initFromData
    );

    const getFormData = useCallback(
        (): RegistrationFormData => ({
            conditions: state.conditions,
            pricingDefinitions: state.pricingDefinitions,
            priceTiers: state.priceTiers,
            capacityLimits: state.capacityLimits,
            showOptionCounts: state.showOptionCounts,
            infoStatsConfig: state.infoStatsConfig,
            fields: flatToNested(state.elements),
        }),
        [
            state.elements,
            state.conditions,
            state.pricingDefinitions,
            state.priceTiers,
            state.capacityLimits,
            state.showOptionCounts,
            state.infoStatsConfig,
        ]
    );

    return { state, dispatch, getFormData };
}
