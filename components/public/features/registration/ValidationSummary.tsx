"use client";

import { Typography } from "@mui/material";
import { ParchmentCallout } from "@/components/public/ui";
import type { ValidationSummaryData } from "./useFormValidation";
import { Fragment } from "react/jsx-runtime";

interface ValidationSummaryProps {
    summary: ValidationSummaryData;
}

export function ValidationSummary({ summary }: ValidationSummaryProps) {
    if (summary.main.length === 0 && summary.people.length === 0) {
        return null;
    }

    return (
        <ParchmentCallout sx={{ mt: 2, textAlign: "left" }}>
            <Typography variant="body1" color="text.secondary">
                <strong>Chybějící nebo špatně vyplněná pole:</strong>
            </Typography>
            {summary.main.length > 0 && (
                <Fragment>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Hlavní osoba:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {summary.main.join(", ")}
                    </Typography>
                </Fragment>
            )}
            {summary.people.map((person) => (
                <Fragment key={person.label}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        <strong>{person.label}:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {person.fields.join(", ")}
                    </Typography>
                </Fragment>
            ))}
        </ParchmentCallout>
    );
}
