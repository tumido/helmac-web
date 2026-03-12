"use client";

import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Typography,
} from "@mui/material";
import type { InputField, OptionCounts, OptionPeople } from "@/lib/types/registration-form";

interface RegistrationStatsProps {
    fields: InputField[];
    optionCounts: OptionCounts;
    optionPeople?: OptionPeople;
    showPeople: boolean;
}

function getFieldOptions(field: InputField, optionCounts: OptionCounts): string[] {
    if (field.options && field.options.length > 0) {
        return field.options;
    }
    if (optionCounts[field.name]) {
        return Object.keys(optionCounts[field.name]);
    }
    return [];
}

export function RegistrationStats({ fields, optionCounts, optionPeople, showPeople }: RegistrationStatsProps) {
    if (fields.length === 0) {
        return null;
    }

    return (
        <Grid container spacing={3}>
            {fields.map((field) => {
                const options = getFieldOptions(field, optionCounts);
                if (options.length === 0) return null;

                return (
                    <Grid item xs={12} sm={6} key={field.id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontSize: "1.1rem" }}>
                                    {field.label}
                                </Typography>
                                <Grid container spacing={2}>
                                    {options.map((option) => {
                                        const count = optionCounts[field.name]?.[option] ?? 0;
                                        const people = optionPeople?.[field.name]?.[option] ?? [];

                                        return (
                                            <Grid item xs={12} sm={6} key={option}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: showPeople && people.length > 0 ? 0.5 : 0 }}>
                                                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                                        {option}
                                                    </Typography>
                                                    <Chip
                                                        label={count}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                                {showPeople && people.length > 0 && (
                                                    <Box sx={{ pl: 1, mt: 0.5 }}>
                                                        {people.map((person, idx) => (
                                                            <Typography
                                                                key={idx}
                                                                variant="caption"
                                                                color="text.secondary"
                                                                component="div"
                                                            >
                                                                {person}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
}
