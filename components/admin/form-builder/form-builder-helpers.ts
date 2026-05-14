import type {
    DescriptionField,
    FieldType,
    FormField,
    HeadingField,
    InputField,
} from "@/lib/types/registration-form";
import type { FlatElement } from "./form-data-adapter";

export function findFlatFieldById(
    flat: FlatElement[],
    fieldId: string
): FormField | null {
    for (const el of flat) {
        if (el.kind === "field" && el.data.field.id === fieldId) {
            return el.data.field;
        }
    }
    return null;
}

export function indexOfFlatId(flat: FlatElement[], id: string): number {
    return flat.findIndex((el) =>
        el.kind === "block" ? el.data.id === id : el.data.field.id === id
    );
}

/** Returns the block id this element sits under, null for root, or undefined if not found. */
export function parentOfFlatId(
    flat: FlatElement[],
    id: string
): string | null | undefined {
    for (const el of flat) {
        if (el.kind === "block" && el.data.id === id) return null;
        if (el.kind === "field" && el.data.field.id === id) {
            return el.data.parentBlockId;
        }
    }
    return undefined;
}

export function updateFieldInFlat(
    flat: FlatElement[],
    updated: FormField
): FlatElement[] {
    return flat.map((el) =>
        el.kind === "field" && el.data.field.id === updated.id
            ? { ...el, data: { ...el.data, field: updated } }
            : el
    );
}

export function patchInputFieldInFlat(
    flat: FlatElement[],
    fieldId: string,
    patch: Partial<InputField>
): FlatElement[] {
    return flat.map((el) => {
        if (el.kind !== "field" || el.data.field.id !== fieldId) return el;
        const f = el.data.field;
        if (f.type === "heading" || f.type === "description") return el;
        return {
            ...el,
            data: { ...el.data, field: { ...f, ...patch } as FormField },
        };
    });
}

export function removeFieldFromFlat(
    flat: FlatElement[],
    fieldId: string
): FlatElement[] {
    return flat.filter(
        (el) => !(el.kind === "field" && el.data.field.id === fieldId)
    );
}

/** Drops the block row and re-parents its children to root. */
export function removeBlockKeepChildren(
    flat: FlatElement[],
    blockId: string
): FlatElement[] {
    return flat.flatMap((el) => {
        if (el.kind === "block" && el.data.id === blockId) return [];
        if (el.kind === "field" && el.data.parentBlockId === blockId) {
            return [{ ...el, data: { ...el.data, parentBlockId: null } }];
        }
        return [el];
    });
}

/** Single source of truth for creating a blank field. Used by palette drop and click-add. */
export function makeBlankField(
    type: FieldType,
    pricingId?: string,
    pricingDefName?: string
): FormField {
    const id = crypto.randomUUID();
    if (type === "heading") {
        return { type: "heading", id, text: "Nový nadpis" } satisfies HeadingField;
    }
    if (type === "description") {
        return {
            type: "description",
            id,
            text: "Popisek textu",
        } satisfies DescriptionField;
    }
    const field: InputField = {
        type,
        id,
        name: `field_${id.substring(0, 8)}`,
        label:
            pricingDefName ??
            (type === "pricing_quantity"
                ? "Cenový počet"
                : type === "pricing_multi_select"
                  ? "Cenový vícevýběr"
                  : type === "pricing_select"
                    ? "Cenový výběr"
                    : "Pole"),
        required: false,
        options: type === "select" || type === "radio" ? ["Možnost 1"] : undefined,
    };
    if (
        type === "pricing_select" ||
        type === "pricing_quantity" ||
        type === "pricing_multi_select"
    ) {
        field.pricingId = pricingId ?? "";
    }
    return field;
}
