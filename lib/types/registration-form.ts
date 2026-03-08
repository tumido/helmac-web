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
    | "heading"
    | "description";

// Condition for conditional field visibility
export interface FieldCondition {
    fieldId: string;
    operator: "equals" | "not_equals";
    value: string;
}

// Count-based capacity condition
export interface CountCondition {
    action: "hide_field" | "disable_option";
    // hide_field: hide when count of `value` on target field >= maxCount
    fieldId?: string;
    value?: string;
    maxCount?: number;
    // disable_option: per-option limits on THIS field
    optionLimits?: Array<{ value: string; maxCount: number }>;
}

// Aggregated option counts: fieldName -> optionValue -> count
export type OptionCounts = Record<string, Record<string, number>>;

// Input field (user fills in a value)
export interface InputField {
    type: Exclude<FieldType, "heading" | "description">;
    id: string;
    name: string;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select/radio
    condition?: FieldCondition;
    countCondition?: CountCondition;
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

// Type guards
export function isInputField(field: FormField): field is InputField {
    return field.type !== "heading" && field.type !== "description";
}

export function isLayoutField(field: FormField): field is HeadingField | DescriptionField {
    return field.type === "heading" || field.type === "description";
}

// Submission data shape
export type SubmissionData = Record<string, string | number | boolean>;

// Metadata for each field type (Czech labels for admin UI)
export const FIELD_TYPE_META: Record<
    FieldType,
    { label: string; icon: string; group: "input" | "layout" }
> = {
    text: { label: "Text", icon: "TextFields", group: "input" },
    email: { label: "Email", icon: "Email", group: "input" },
    textarea: { label: "Dlouhý text", icon: "Notes", group: "input" },
    number: { label: "Číslo", icon: "Numbers", group: "input" },
    checkbox: { label: "Zaškrtávací pole", icon: "CheckBox", group: "input" },
    select: { label: "Výběr z možností", icon: "List", group: "input" },
    radio: { label: "Přepínač", icon: "RadioButtonChecked", group: "input" },
    date: { label: "Datum", icon: "CalendarMonth", group: "input" },
    heading: { label: "Nadpis", icon: "Title", group: "layout" },
    description: { label: "Popisek", icon: "Article", group: "layout" },
};
