// Field types available in the form builder
export type FieldType =
    | "text"
    | "email"
    | "textarea"
    | "number"
    | "checkbox"
    | "select"
    | "radio"
    | "date"
    | "birth_date"
    | "pricing_select"
    | "heading"
    | "description";

// Input field (user fills in a value)
export interface InputField {
    type: Exclude<FieldType, "heading" | "description">;
    id: string;
    name: string;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select/radio
    pricingId?: string; // For pricing_select: references PricingDefinition.id
    includeForAdditionalPeople?: boolean; // Field shown for additional people in group registration
}

// --- Group registration ---

export const MAX_ADDITIONAL_PEOPLE = 20;
export type AdditionalPersonData = Record<string, string | number | boolean>;

// --- Pricing system ---

export interface PricedOption {
    id: string;
    name: string;           // e.g. "Základní balíček"
    description: string;    // e.g. "Ubytování ve stanu, strava"
    prices: number[];       // prices[i] for priceTiers[i], prices[length-1] = fallback (after last tier)
}

export interface PricingDefinition {
    id: string;
    name: string;           // admin label, e.g. "Ubytování"
    priceTiers: string[];   // ISO date deadlines, shared across options
    options: PricedOption[];
}

// Layout: heading
export interface HeadingField {
    type: "heading";
    id: string;
    text: string;
}

// Layout: description/text block
export interface DescriptionField {
    type: "description";
    id: string;
    text: string;
}

export type FormField = InputField | HeadingField | DescriptionField;

// --- Condition system (named condition blocks) ---

export interface ConditionRule {
    type: "field_value";
    fieldId?: string;
    operator?: "equals" | "not_equals";
    value?: string;
}

export interface CapacityLimit {
    id: string;
    fieldId: string;    // references InputField.id
    value: string;      // option value to limit
    maxCount: number;   // max registrations for this option
}

export interface FormCondition {
    id: string;
    name: string;                  // admin-defined label, e.g. "Děti"
    rules: ConditionRule[];        // AND logic — all must pass for block to be visible
}

export interface ConditionBlock {
    type: "condition";
    id: string;
    conditionId: string;           // references FormCondition.id
    children: FormField[];         // nested fields (no nesting of blocks)
}

export type FormElement = FormField | ConditionBlock;

export interface RegistrationFormData {
    conditions: FormCondition[];           // defined in "Podmínky" tab
    pricingDefinitions: PricingDefinition[]; // defined in "Ceník" tab
    capacityLimits: CapacityLimit[];       // capacity limits for options
    showOptionCounts: string[];            // field IDs whose option counts are shown publicly
    infoStatsConfig?: InfoStatsConfig;     // info page statistics configuration
    fields: FormElement[];                 // form content, can contain ConditionBlocks
}

// --- Type guards ---

export function isInputField(field: FormField): field is InputField {
    return field.type !== "heading" && field.type !== "description";
}

export function isLayoutField(field: FormField): field is HeadingField | DescriptionField {
    return field.type === "heading" || field.type === "description";
}

export function isConditionBlock(element: FormElement): element is ConditionBlock {
    return (element as ConditionBlock).type === "condition";
}

// --- Utility functions ---

/** Get all FormField items from elements (flattens condition blocks) */
export function getAllFields(elements: FormElement[]): FormField[] {
    const result: FormField[] = [];
    for (const el of elements) {
        if (isConditionBlock(el)) {
            result.push(...el.children);
        } else {
            result.push(el);
        }
    }
    return result;
}

/** Get all InputField items from elements (flattens condition blocks, filters layout) */
export function getAllInputFields(elements: FormElement[]): InputField[] {
    return getAllFields(elements).filter((f): f is InputField => isInputField(f));
}

/** Get all InputField items marked for additional people */
export function getAPInputFields(elements: FormElement[]): InputField[] {
    return getAllInputFields(elements).filter((f) => f.includeForAdditionalPeople === true);
}

/** Check if any input field is marked for additional people */
export function hasAdditionalPeopleFields(elements: FormElement[]): boolean {
    return getAllInputFields(elements).some((f) => f.includeForAdditionalPeople === true);
}

// Aggregated option counts: fieldName -> optionValue -> count
export type OptionCounts = Record<string, Record<string, number>>;

// Aggregated option people: fieldName -> optionValue -> person labels
export type OptionPeople = Record<string, Record<string, string[]>>;

// Info stats config for public info page
export interface InfoStatsConfig {
    enabled: boolean;
    fieldIds: string[];         // field IDs to track (select/radio/pricing_select)
    personFieldId?: string;     // field to use as person label
    showPeople: boolean;        // whether to list people under each option
}

/** Returns a Set of option values that are disabled (at capacity) for a given field */
export function getDisabledOptionsForField(
    fieldId: string,
    fieldName: string,
    capacityLimits: CapacityLimit[],
    optionCounts?: OptionCounts,
): Set<string> {
    const disabled = new Set<string>();
    if (!optionCounts) return disabled;
    for (const limit of capacityLimits) {
        if (limit.fieldId === fieldId) {
            const currentCount = optionCounts[fieldName]?.[limit.value] ?? 0;
            if (currentCount >= limit.maxCount) {
                disabled.add(limit.value);
            }
        }
    }
    return disabled;
}

// --- Pricing summary (stored in DB) ---

export interface PricingTier {
    tierDate: string | null; // ISO date deadline, null = fallback
    totalPrice: number;
}

export interface PricingSummaryData {
    tiers: PricingTier[];
    applicableTierIndex: number;
    totalPrice: number;
}

// Submission data shape
export type SubmissionData = Record<string, string | number | boolean>;

// Metadata for each field type (Czech labels for admin UI)
export const FIELD_TYPE_META: Record<
    FieldType,
    { label: string; icon: string; group: "input" | "layout" | "pricing" }
> = {
    text: { label: "Text", icon: "TextFields", group: "input" },
    email: { label: "Email", icon: "Email", group: "input" },
    textarea: { label: "Dlouhý text", icon: "Notes", group: "input" },
    number: { label: "Číslo", icon: "Numbers", group: "input" },
    checkbox: { label: "Zaškrtávací pole", icon: "CheckBox", group: "input" },
    select: { label: "Výběr z možností", icon: "List", group: "input" },
    radio: { label: "Přepínač", icon: "RadioButtonChecked", group: "input" },
    date: { label: "Datum", icon: "CalendarMonth", group: "input" },
    birth_date: { label: "Datum narození", icon: "Cake", group: "input" },
    pricing_select: { label: "Cenový výběr", icon: "Sell", group: "pricing" },
    heading: { label: "Nadpis", icon: "Title", group: "layout" },
    description: { label: "Popisek", icon: "Article", group: "layout" },
};
