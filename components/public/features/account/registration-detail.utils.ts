import React from "react";
import { Box } from "@mui/material";
import {
    type FormField,
    type HeadingField,
    type InputField,
    isInputField,
} from "@/lib/types/registration-form";
import { formatDate } from "@/lib/utils/date";
import { parseSelected } from "@/lib/utils/pricing-field-values";

export interface FieldSection {
    heading: HeadingField | null;
    fields: FormField[];
}

function formatDateValue(value: string | number | boolean): string {
    if (typeof value !== "string") return String(value);
    if (value.includes("-")) {
        const formatted = formatDate(value);
        if (formatted !== "—") return formatted;
    }
    return value;
}

export function getDisplayValue(
    field: FormField,
    data: Record<string, unknown>
): React.ReactNode | null {
    if (!isInputField(field)) return null;

    const value = data[field.name];
    if (value === undefined || value === null || value === "") return null;

    switch (field.type) {
        case "checkbox":
            return value ? "Ano" : "Ne";
        case "date":
        case "birth_date":
            return formatDateValue(value as string | number | boolean);
        case "pricing_multi_select": {
            const names = parseSelected(value);
            if (names.length === 0) return null;
            return React.createElement(
                Box,
                {
                    component: "ul",
                    sx: { m: 0, pl: 2, listStyle: "disc" },
                },
                names.map((name, i) =>
                    React.createElement("li", { key: i }, name)
                )
            );
        }
        default:
            return String(value);
    }
}

export function isFieldEditable(field: FormField): field is InputField {
    return (
        isInputField(field) &&
        !!field.editable &&
        !field.type.startsWith("pricing_")
    );
}

export function splitIntoSections(fields: FormField[]): FieldSection[] {
    const sections: FieldSection[] = [];
    let current: FieldSection = { heading: null, fields: [] };
    for (const field of fields) {
        if (field.type === "heading") {
            if (current.heading || current.fields.length > 0) {
                sections.push(current);
            }
            current = { heading: field, fields: [] };
        } else if (field.type !== "description") {
            current.fields.push(field);
        }
    }
    if (current.heading || current.fields.length > 0) {
        sections.push(current);
    }
    return sections;
}
