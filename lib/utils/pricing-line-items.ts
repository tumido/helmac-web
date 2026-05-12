import type {
    InputField,
    PricingDefinition,
    AdditionalPersonData,
    RegistrationFormData,
} from "@/lib/types/registration-form";
import {
    getAllFields,
    isInputField,
    isConditionBlock,
} from "@/lib/types/registration-form";
import { getCurrentTierIndex } from "@/lib/utils/pricing";
import { evaluateCondition } from "@/lib/utils/condition-evaluation";

function evaluateVisibleFields(
    formData: RegistrationFormData,
    values: Record<string, unknown>,
): Set<string> {
    const visible = new Set<string>();
    const allFields = getAllFields(formData.fields);
    const conditionMap = new Map(
        formData.conditions.map((c) => [c.id, c]),
    );
    for (const el of formData.fields) {
        if (isConditionBlock(el)) {
            const condition = conditionMap.get(el.conditionId);
            if (!condition) continue;
            if (evaluateCondition(condition, values, allFields)) {
                for (const child of el.children) visible.add(child.id);
            }
        } else {
            visible.add(el.id);
        }
    }
    return visible;
}

export interface PricingLineItem {
    label: string;
    optionName: string;
    price: number;
}

export interface PricingLineGroup {
    personIndex: number;
    lines: PricingLineItem[];
    total: number;
}

export interface PricingLineSummary {
    mainLines: PricingLineItem[];
    apLines: PricingLineGroup[];
    grandTotal: number;
}

function parseQuantities(val: unknown): Record<string, number> {
    try {
        const parsed = typeof val === "string" ? JSON.parse(val || "{}") : val;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as Record<string, number>;
        }
    } catch {
        /* empty */
    }
    return {};
}

function parseSelected(val: unknown): string[] {
    try {
        const arr = JSON.parse(String(val ?? "[]"));
        return Array.isArray(arr)
            ? arr.filter((v): v is string => typeof v === "string")
            : [];
    } catch {
        return [];
    }
}

function addLine(
    target: PricingLineItem[],
    item: PricingLineItem,
): void {
    target.push(item);
}

function ensureAPGroup(
    groups: PricingLineGroup[],
    personIndex: number,
): PricingLineGroup {
    let group = groups.find((g) => g.personIndex === personIndex);
    if (!group) {
        group = { personIndex, lines: [], total: 0 };
        groups.push(group);
    }
    return group;
}

/**
 * Computes price line items (main person + each additional person) for a
 * stored registration. Mirrors the live computation in PriceSummary, but
 * operates on persisted submission data and re-evaluates condition visibility
 * from the same data.
 */
export function computePricingLineItems(
    formData: RegistrationFormData,
    submissionData: Record<string, unknown>,
    additionalPeople: AdditionalPersonData[],
): PricingLineSummary {
    const allFields = getAllFields(formData.fields);
    const inputFields = allFields.filter((f): f is InputField => isInputField(f));

    const visibleMain = evaluateVisibleFields(formData, submissionData);
    const visibleAPPerPerson = additionalPeople.map((person) => {
        const merged = {
            ...submissionData,
            ...(person as Record<string, unknown>),
        };
        return evaluateVisibleFields(formData, merged);
    });

    const pricingFields = inputFields.filter(
        (f) =>
            (f.type === "pricing_select" ||
                f.type === "pricing_quantity" ||
                f.type === "pricing_multi_select") &&
            f.pricingId,
    );

    const mainLines: PricingLineItem[] = [];
    const apLines: PricingLineGroup[] = [];

    for (const field of pricingFields) {
        const def: PricingDefinition | undefined =
            formData.pricingDefinitions.find((d) => d.id === field.pricingId);
        if (!def) continue;
        const tierIdx = getCurrentTierIndex(
            def.usePriceTiers ? formData.priceTiers : [],
        );

        if (field.type === "pricing_quantity") {
            const mainQty = parseQuantities(submissionData[field.name]);
            if (visibleMain.has(field.id)) {
                for (const opt of def.options) {
                    const qty = Number(mainQty[opt.name]) || 0;
                    if (qty <= 0) continue;
                    const unitPrice = opt.prices[tierIdx] ?? 0;
                    addLine(mainLines, {
                        label: field.label,
                        optionName: `${opt.name} ${qty}x${def.unitName ? ` ${def.unitName}` : ""}`,
                        price: unitPrice * qty,
                    });
                }
            }
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    if (!visibleAPPerPerson[idx]?.has(field.id)) return;
                    const personQty = parseQuantities(person[field.name]);
                    for (const opt of def.options) {
                        const qty = Number(personQty[opt.name]) || 0;
                        if (qty <= 0) continue;
                        const unitPrice = opt.prices[tierIdx] ?? 0;
                        const group = ensureAPGroup(apLines, idx);
                        group.lines.push({
                            label: field.label,
                            optionName: `${opt.name} ${qty}x${def.unitName ? ` ${def.unitName}` : ""}`,
                            price: unitPrice * qty,
                        });
                    }
                });
            }
        } else if (field.type === "pricing_multi_select") {
            const mainSelected = parseSelected(submissionData[field.name]);
            if (mainSelected.length > 0 && visibleMain.has(field.id)) {
                for (const optName of mainSelected) {
                    const opt = def.options.find((o) => o.name === optName);
                    if (!opt) continue;
                    addLine(mainLines, {
                        label: field.label,
                        optionName: opt.name,
                        price: opt.prices[tierIdx] ?? 0,
                    });
                }
            }
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    if (!visibleAPPerPerson[idx]?.has(field.id)) return;
                    const personSelected = parseSelected(person[field.name]);
                    for (const optName of personSelected) {
                        const opt = def.options.find((o) => o.name === optName);
                        if (!opt) continue;
                        const group = ensureAPGroup(apLines, idx);
                        group.lines.push({
                            label: field.label,
                            optionName: opt.name,
                            price: opt.prices[tierIdx] ?? 0,
                        });
                    }
                });
            }
        } else {
            const mainVal = String(submissionData[field.name] ?? "");
            if (mainVal && visibleMain.has(field.id)) {
                const opt = def.options.find((o) => o.name === mainVal);
                if (opt) {
                    addLine(mainLines, {
                        label: field.label,
                        optionName: opt.name,
                        price: opt.prices[tierIdx] ?? 0,
                    });
                }
            }
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    if (!visibleAPPerPerson[idx]?.has(field.id)) return;
                    const personVal = String(person[field.name] ?? "");
                    if (!personVal) return;
                    const opt = def.options.find((o) => o.name === personVal);
                    if (!opt) return;
                    const group = ensureAPGroup(apLines, idx);
                    group.lines.push({
                        label: field.label,
                        optionName: opt.name,
                        price: opt.prices[tierIdx] ?? 0,
                    });
                });
            }
        }
    }

    for (const group of apLines) {
        group.total = Math.max(
            0,
            group.lines.reduce((sum, l) => sum + l.price, 0),
        );
    }
    const mainTotal = Math.max(
        0,
        mainLines.reduce((sum, l) => sum + l.price, 0),
    );
    const grandTotal =
        mainTotal + apLines.reduce((sum, g) => sum + g.total, 0);

    return { mainLines, apLines, grandTotal };
}
