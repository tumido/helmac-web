import type {
    ConditionBlock,
    FormElement,
    FormField,
} from "@/lib/types/registration-form";
import { isConditionBlock } from "@/lib/types/registration-form";

export interface FlatField {
    field: FormField;
    parentBlockId: string | null;
}

export interface FlatBlock {
    type: "condition";
    id: string;
    conditionId: string;
}

export type FlatElement =
    | { kind: "field"; data: FlatField }
    | { kind: "block"; data: FlatBlock };

export function flatElementId(el: FlatElement): string {
    return el.kind === "block" ? el.data.id : el.data.field.id;
}

export function nestedToFlat(elements: FormElement[]): FlatElement[] {
    const out: FlatElement[] = [];
    for (const el of elements) {
        if (isConditionBlock(el)) {
            out.push({
                kind: "block",
                data: {
                    type: "condition",
                    id: el.id,
                    conditionId: el.conditionId,
                },
            });
            for (const child of el.children) {
                out.push({
                    kind: "field",
                    data: { field: child, parentBlockId: el.id },
                });
            }
        } else {
            out.push({
                kind: "field",
                data: { field: el, parentBlockId: null },
            });
        }
    }
    return out;
}

export function flatToNested(flat: FlatElement[]): FormElement[] {
    const out: FormElement[] = [];
    let currentBlock: ConditionBlock | null = null;
    for (const el of flat) {
        if (el.kind === "block") {
            currentBlock = {
                type: "condition",
                id: el.data.id,
                conditionId: el.data.conditionId,
                children: [],
            };
            out.push(currentBlock);
            continue;
        }
        if (el.data.parentBlockId == null) {
            currentBlock = null;
            out.push(el.data.field);
        } else if (
            currentBlock &&
            currentBlock.id === el.data.parentBlockId
        ) {
            currentBlock.children.push(el.data.field);
        } else {
            // Invariant violation: orphan child. Treat as root to avoid data loss.
            currentBlock = null;
            out.push(el.data.field);
        }
    }
    return out;
}
