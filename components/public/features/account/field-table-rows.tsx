import React from "react";
import {
    TableCell,
    TableRow,
    Typography,
} from "@mui/material";
import { type FormField, isInputField } from "@/lib/types/registration-form";
import { getDisplayValue, splitIntoSections } from "./registration-detail.utils";

function SectionHeadingRow({ text }: { text: string }) {
    return (
        <TableRow>
            <TableCell
                colSpan={2}
                sx={{
                    pt: 3,
                    pb: 1,
                    px: { xs: 2, md: 3 },
                    borderBottom: "none",
                }}
            >
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "primary.main",
                    }}
                >
                    {text}
                </Typography>
            </TableCell>
        </TableRow>
    );
}

export function FieldTableRows({
    fields,
    data,
    apOnly,
}: {
    fields: FormField[];
    data: Record<string, unknown>;
    apOnly?: boolean;
}) {
    const sections = splitIntoSections(fields);
    return (
        <>
            {sections.map((section) => {
                const visibleFields = section.fields
                    .filter(isInputField)
                    .filter(
                        (f) =>
                            (!apOnly ||
                                f.includeForAdditionalPeople) &&
                            getDisplayValue(f, data) !== null,
                    );
                if (visibleFields.length === 0) return null;
                return (
                    <React.Fragment
                        key={section.heading?.id ?? visibleFields[0].id}
                    >
                        {section.heading && (
                            <SectionHeadingRow text={section.heading.text} />
                        )}
                        {visibleFields.map((field) => (
                            <TableRow key={field.id}>
                                <TableCell
                                    sx={{
                                        color: "text.secondary",
                                        whiteSpace: {
                                            xs: "normal",
                                            sm: "nowrap",
                                        },
                                        width: {
                                            xs: "auto",
                                            sm: "1%",
                                        },
                                        px: { xs: 2, md: 3 },
                                        py: 1,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        verticalAlign: "top",
                                    }}
                                >
                                    {field.label}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        px: { xs: 2, md: 3 },
                                        py: 1,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    {getDisplayValue(field, data)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                );
            })}
        </>
    );
}
