"use client";

import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Typography,
} from "@mui/material";
import type { InfoStatItem, InputField, OptionCounts, OptionPeople, CapacityLimit } from "@/lib/types/registration-form";

interface RegistrationStatsProps {
    stats: InfoStatItem[];
    fieldsMap: Record<string, InputField>;
    optionCounts: OptionCounts;
    optionPeopleMap: Record<string, OptionPeople>;
    capacityLimits?: CapacityLimit[];
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

export function RegistrationStats({ stats, fieldsMap, optionCounts, optionPeopleMap, capacityLimits }: RegistrationStatsProps) {
    if (stats.length === 0) {
        return null;
    }

    return (
        <Grid container spacing={3}>
            {stats.map((stat) => {
                const field = fieldsMap[stat.fieldId];
                if (!field) return null;

                const options = getFieldOptions(field, optionCounts);
                if (options.length === 0) return null;

                const displayName = stat.name?.trim() || field.label;
                const people = stat.showPeople && stat.personFieldId
                    ? optionPeopleMap[stat.personFieldId]?.[field.name]
                    : undefined;

                return (
                    <Grid item xs={12} sm={6} key={stat.id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontSize: "1.1rem" }}>
                                    {displayName}
                                </Typography>
                                <Grid container spacing={2}>
                                    {options.map((option) => {
                                        const count = optionCounts[field.name]?.[option] ?? 0;
                                        const personList = people?.[option] ?? [];

                                        return (
                                            <Grid item xs={12} sm={6} key={option}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: stat.showPeople && personList.length > 0 ? 0.5 : 0 }}>
                                                    <Chip
                                                        label={(() => {
                                                            const limit = capacityLimits?.find(
                                                                (cl) => cl.fieldId === field.id && cl.value === option,
                                                            );
                                                            return limit ? `${count}/${limit.maxCount}` : count;
                                                        })()}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                                        {option}
                                                    </Typography>
                                                </Box>
                                                {stat.showPeople && personList.length > 0 && (
                                                    <Box sx={{ pl: 1, mt: 0.5 }}>
                                                        {personList.map((person, idx) => (
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
