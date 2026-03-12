"use client";

import {
    Box,
    Card,
    CardContent,
    Chip,
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {stats.map((stat) => {
                const resolvedFields = stat.fieldIds
                    .map((fid) => fieldsMap[fid])
                    .filter((f): f is InputField => !!f);

                if (resolvedFields.length === 0) return null;

                const displayName = stat.name?.trim() || resolvedFields.map((f) => f.label).join(" / ");

                return (
                    <Card
                        variant="outlined"
                        key={stat.id}
                        sx={{
                            minWidth: "100%",
                            maxWidth: "90vw",
                            position: "relative",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontSize: "1.1rem" }}>
                                {displayName}
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 8, rowGap: 2 }}>
                                {resolvedFields.map((field) => {
                                    const options = getFieldOptions(field, optionCounts);
                                    if (options.length === 0) return null;

                                    const people = stat.showPeople && stat.personFieldId
                                        ? optionPeopleMap[stat.personFieldId]?.[field.name]
                                        : undefined;

                                    return options.map((option) => {
                                        const count = optionCounts[field.name]?.[option] ?? 0;
                                        const personList = people?.[option] ?? [];

                                        return (
                                            <Box key={`${field.id}-${option}`}>
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
                                                    <Typography variant="body2">
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
                                            </Box>
                                        );
                                    });
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
}
