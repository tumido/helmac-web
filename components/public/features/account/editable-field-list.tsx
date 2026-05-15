import React from "react";
import { Box, Typography } from "@mui/material";
import {
    type FormField,
    type RegistrationFormData,
} from "@/lib/types/registration-form";
import { DynamicFormField } from "@/components/public/features/registration/DynamicFormField";
import { isFieldEditable, splitIntoSections } from "./registration-detail.utils";

export function EditableFieldList({
    fields,
    data,
    formData,
    errors,
    namePrefix,
    onChange,
    visibleFields,
    apOnly,
}: {
    fields: FormField[];
    data: Record<string, unknown>;
    formData: RegistrationFormData;
    errors?: Record<string, string[]>;
    namePrefix?: string;
    onChange: (name: string, value: string | number | boolean) => void;
    visibleFields?: Set<string>;
    apOnly?: boolean;
}) {
    const sections = splitIntoSections(fields);
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                px: { xs: 2, md: 3 },
                py: 2,
            }}
        >
            {sections.map((section) => {
                const editableFields = section.fields
                    .filter(isFieldEditable)
                    .filter(
                        (f) =>
                            (!visibleFields ||
                                visibleFields.has(f.id)) &&
                            (!apOnly ||
                                f.includeForAdditionalPeople),
                    );
                if (editableFields.length === 0) return null;
                return (
                    <React.Fragment
                        key={section.heading?.id ?? editableFields[0].id}
                    >
                        {section.heading && (
                            <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    color: "primary.main",
                                    mt: 1,
                                }}
                            >
                                {section.heading.text}
                            </Typography>
                        )}
                        {editableFields.map((field) => {
                            const value = data[field.name];
                            const normalized: string | number | boolean =
                                typeof value === "string" ||
                                typeof value === "number" ||
                                typeof value === "boolean"
                                    ? value
                                    : value == null
                                      ? ""
                                      : String(value);
                            const fieldError = errors?.[field.name]?.[0];
                            return (
                                <DynamicFormField
                                    key={field.id}
                                    field={field}
                                    value={normalized}
                                    error={fieldError}
                                    onChange={onChange}
                                    pricingDefinitions={
                                        formData.pricingDefinitions
                                    }
                                    priceTiers={formData.priceTiers}
                                    namePrefix={namePrefix}
                                />
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </Box>
    );
}
