"use client";

import { useCallback, useEffect } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, Close } from "@mui/icons-material";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import type {
    RegistrationFormData,
    InputField,
    SubmissionData,
    OptionCounts,
    AdditionalPersonData,
} from "@/lib/types/registration-form";
import {
    MAX_ADDITIONAL_PEOPLE,
    getDisabledOptionsForField,
} from "@/lib/types/registration-form";
import { DynamicFormField } from "./DynamicFormField";
import { evaluateAPVisibleFields } from "./useConditionalFields";
import {
    buildMergedDataForAP,
    getAPFieldNames,
} from "@/lib/utils/additional-people";

interface AdditionalPeopleSectionProps {
    formData: RegistrationFormData;
    apFields: InputField[];
    mainValues: SubmissionData;
    optionCounts?: OptionCounts;
    people: AdditionalPersonData[];
    onPeopleChange: (people: AdditionalPersonData[]) => void;
    errors?: Record<number, Record<string, string[]>>;
}

export function AdditionalPeopleSection({
    formData,
    apFields,
    mainValues,
    optionCounts,
    people,
    onPeopleChange,
    errors,
}: AdditionalPeopleSectionProps) {
    const apFieldNames = getAPFieldNames(formData.fields);

    // Auto-select single enabled option for pricing_select, select, and radio fields
    useEffect(() => {
        if (people.length === 0) return;

        let hasUpdates = false;
        const updatedPeople = people.map((person) => {
            const mergedData = buildMergedDataForAP(
                mainValues,
                person,
                apFieldNames
            );
            const visibleFieldIds = evaluateAPVisibleFields(
                formData,
                mergedData
            );
            let personUpdated = false;
            const newPerson = { ...person };

            for (const field of apFields) {
                if (!visibleFieldIds.has(field.id)) continue;
                const currentValue = person[field.name];
                if (currentValue !== "" && currentValue !== undefined) continue;

                if (field.type === "pricing_select" && field.pricingId) {
                    const def = formData.pricingDefinitions.find(
                        (d) => d.id === field.pricingId
                    );
                    if (!def) continue;
                    const disabledOpts = getDisabledOptionsForField(
                        field.id,
                        field.name,
                        formData.capacityLimits,
                        optionCounts
                    );
                    const enabledOptions = def.options.filter(
                        (o) => !disabledOpts.has(o.name)
                    );
                    if (enabledOptions.length === 1) {
                        newPerson[field.name] = enabledOptions[0].id;
                        personUpdated = true;
                    }
                } else if (field.type === "select" || field.type === "radio") {
                    if (!field.options || field.options.length === 0) continue;
                    const disabledOpts = getDisabledOptionsForField(
                        field.id,
                        field.name,
                        formData.capacityLimits,
                        optionCounts
                    );
                    const enabledOptions = field.options.filter(
                        (o) => !disabledOpts.has(o)
                    );
                    if (enabledOptions.length === 1) {
                        newPerson[field.name] = enabledOptions[0];
                        personUpdated = true;
                    }
                }
            }

            if (personUpdated) hasUpdates = true;
            return personUpdated ? newPerson : person;
        });

        if (hasUpdates) {
            onPeopleChange(updatedPeople);
        }
    }, [
        people,
        apFields,
        mainValues,
        formData,
        optionCounts,
        apFieldNames,
        onPeopleChange,
    ]);

    const handleAddPerson = useCallback(() => {
        if (people.length >= MAX_ADDITIONAL_PEOPLE) return;
        const newPerson: AdditionalPersonData = {};
        for (const field of apFields) {
            if (field.type === "checkbox") {
                newPerson[field.name] = false;
            } else if (field.type === "pricing_quantity") {
                newPerson[field.name] = "{}";
            } else if (field.type === "pricing_multi_select") {
                newPerson[field.name] = "[]";
            } else {
                newPerson[field.name] = "";
            }
        }
        onPeopleChange([...people, newPerson]);
    }, [people, apFields, onPeopleChange]);

    const handleRemovePerson = useCallback(
        (index: number) => {
            onPeopleChange(people.filter((_, i) => i !== index));
        },
        [people, onPeopleChange]
    );

    const handleFieldChange = useCallback(
        (
            personIndex: number,
            name: string,
            value: string | number | boolean
        ) => {
            const updated = [...people];
            updated[personIndex] = { ...updated[personIndex], [name]: value };
            onPeopleChange(updated);
        },
        [people, onPeopleChange]
    );

    return (
        <Box sx={{ mt: 4 }}>
            <Box
                sx={{
                    textAlign: "center",
                    mb: { xs: 4, md: 6 },
                }}
            >
                <Box sx={{ display: "inline-block" }}>
                    <Typography variant="h3" component="h3">
                        Další osoby
                    </Typography>
                    <OrnamentalUnderline />
                </Box>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        mt: 2,
                        fontStyle: "italic",
                        letterSpacing: "0.03em",
                    }}
                >
                    Můžete přidat další osoby, které registrujete společně s
                    vámi.
                </Typography>
            </Box>

            {people.map((person, personIndex) => {
                const mergedData = buildMergedDataForAP(
                    mainValues,
                    person,
                    apFieldNames
                );
                const visibleFieldIds = evaluateAPVisibleFields(
                    formData,
                    mergedData
                );
                const personErrors = errors?.[personIndex];

                return (
                    <Paper
                        key={personIndex}
                        variant="outlined"
                        sx={{ p: 3, mb: 2 }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        backgroundColor: "primary.main",
                                        color: "primary.contrastText",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: "0.875rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {personIndex + 2}
                                </Box>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                >
                                    Osoba č. {personIndex + 2}
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Close />}
                                onClick={() => handleRemovePerson(personIndex)}
                                color="primary"
                                sx={{
                                    borderWidth: 2,
                                    textTransform: "none",
                                    fontFamily: "inherit",
                                    letterSpacing: 0,
                                    "&:hover": {
                                        borderWidth: 2,
                                    },
                                }}
                            >
                                Odebrat
                            </Button>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2.5,
                            }}
                        >
                            {apFields.map((field) => {
                                if (!visibleFieldIds.has(field.id)) return null;

                                const value =
                                    person[field.name] ??
                                    (field.type === "checkbox" ? false : "");
                                const disabledOpts = getDisabledOptionsForField(
                                    field.id,
                                    field.name,
                                    formData.capacityLimits,
                                    optionCounts
                                );

                                return (
                                    <DynamicFormField
                                        key={field.id}
                                        field={field}
                                        value={value}
                                        error={personErrors?.[field.name]?.[0]}
                                        onChange={(name, val) =>
                                            handleFieldChange(
                                                personIndex,
                                                name,
                                                val
                                            )
                                        }
                                        pricingDefinitions={
                                            formData.pricingDefinitions
                                        }
                                        priceTiers={formData.priceTiers}
                                        namePrefix={`ap_${personIndex}_`}
                                        disabledOptions={disabledOpts}
                                    />
                                );
                            })}
                        </Box>
                    </Paper>
                );
            })}

            {people.length === 0 ? (
                <Box
                    onClick={handleAddPerson}
                    sx={{
                        p: 3,
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            borderColor: "primary.main",
                            backgroundColor: (theme) =>
                                alpha(
                                    theme.palette.primary.main,
                                    theme.palette.mode === "dark" ? 0.05 : 0.08
                                ),
                        },
                    }}
                >
                    <Add
                        sx={{
                            fontSize: 32,
                            color: "primary.main",
                            mb: 1,
                        }}
                    />
                    <Typography variant="body1" fontWeight={600}>
                        Přidat další osobu
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Registrujte další účastníky v rámci jedné registrace
                    </Typography>
                </Box>
            ) : (
                <Button
                    startIcon={<Add />}
                    variant="outlined"
                    onClick={handleAddPerson}
                    disabled={people.length >= MAX_ADDITIONAL_PEOPLE}
                >
                    Přidat další osobu
                </Button>
            )}

            {/* Hidden input to send AP data to server */}
            <input
                type="hidden"
                name="__additionalPeople"
                value={JSON.stringify(people)}
            />
        </Box>
    );
}
