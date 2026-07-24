"use client";

import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    Radio,
    Typography,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Chip,
} from "@mui/material";
import { Save, ExpandMore, Delete } from "@mui/icons-material";
import type {
    OrderDetailPerson,
    V2PricingDef,
} from "@/lib/services/v2";
import { updateSubmissionData } from "@/lib/actions/registration-submissions";

interface FieldMeta {
    id: string;
    name: string;
    label: string;
    type: string;
    isActive: boolean;
    options: string[];
    pricingDefinitionId: string | null;
    includeForAP: boolean;
    sortOrder: number;
}

interface PersonState {
    personIndex: number;
    values: Record<string, string>;
    quantities: Record<string, Record<string, number>>;
    multiSelects: Record<string, string[]>;
}

interface SubmissionEditFormProps {
    legacySubmissionId: string;
    fields: FieldMeta[];
    pricingDefinitions: V2PricingDef[];
    people: OrderDetailPerson[];
    readOnly?: boolean;
}

function buildPersonState(
    person: OrderDetailPerson,
): PersonState {
    const values: Record<string, string> = {};
    const quantities: Record<
        string,
        Record<string, number>
    > = {};
    const multiSelects: Record<string, string[]> = {};

    for (const li of person.lineItems) {
        const name = li.fieldName;
        if (
            li.fieldType === "pricing_quantity" &&
            li.pricingOptionId
        ) {
            if (!quantities[name]) quantities[name] = {};
            quantities[name][li.pricingOptionId] =
                li.quantity;
        } else if (
            li.fieldType === "pricing_multi_select" &&
            li.pricingOptionId
        ) {
            if (!multiSelects[name])
                multiSelects[name] = [];
            multiSelects[name].push(li.pricingOptionId);
        } else if (
            li.fieldType === "pricing_select" &&
            li.pricingOptionId
        ) {
            values[name] = li.pricingOptionId;
        } else {
            values[name] = li.value ?? "";
        }
    }

    return {
        personIndex: person.personIndex,
        values,
        quantities,
        multiSelects,
    };
}

function buildFieldsFromLineItems(
    people: OrderDetailPerson[],
): FieldMeta[] {
    const seen = new Map<string, FieldMeta>();
    for (const person of people) {
        for (const li of person.lineItems) {
            if (seen.has(li.fieldName)) continue;
            seen.set(li.fieldName, {
                id: li.fieldId,
                name: li.fieldName,
                label: li.fieldLabel,
                type: li.fieldType,
                isActive: li.fieldIsActive,
                options: li.fieldOptions,
                pricingDefinitionId:
                    li.fieldPricingDefinitionId,
                includeForAP: li.fieldIncludeForAP,
                sortOrder: li.fieldSortOrder,
            });
        }
    }
    return Array.from(seen.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder,
    );
}

function FieldRenderer({
    field,
    value,
    quantities,
    multiSelected,
    pricingDef,
    onChange,
    onQuantityChange,
    onMultiSelectChange,
    disabled,
}: {
    field: FieldMeta;
    value: string;
    quantities?: Record<string, number>;
    multiSelected?: string[];
    pricingDef?: V2PricingDef;
    onChange: (value: string) => void;
    onQuantityChange?: (
        optionId: string,
        qty: number,
    ) => void;
    onMultiSelectChange?: (selected: string[]) => void;
    disabled: boolean;
}) {
    const label = field.isActive ? (
        field.label
    ) : (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
            }}
        >
            {field.label}
            <Chip
                label="Zrušené pole"
                size="small"
                variant="outlined"
                color="default"
                sx={{ height: 20, fontSize: "0.7rem" }}
            />
        </Box>
    );

    switch (field.type) {
        case "checkbox":
            return (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={value === "true"}
                            onChange={(e) =>
                                onChange(
                                    String(
                                        e.target.checked,
                                    ),
                                )
                            }
                            disabled={disabled}
                        />
                    }
                    label={label}
                />
            );

        case "select":
            return (
                <FormControl fullWidth size="small">
                    <InputLabel>{label}</InputLabel>
                    <Select
                        value={value}
                        onChange={(e) =>
                            onChange(
                                e.target.value as string,
                            )
                        }
                        label={field.label}
                        disabled={disabled}
                    >
                        {field.options.map((opt) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );

        case "radio":
            return (
                <FormControl>
                    <Typography variant="body2">
                        {label}
                    </Typography>
                    <RadioGroup
                        value={value}
                        onChange={(e) =>
                            onChange(e.target.value)
                        }
                    >
                        {field.options.map((opt) => (
                            <FormControlLabel
                                key={opt}
                                value={opt}
                                control={
                                    <Radio
                                        size="small"
                                        disabled={disabled}
                                    />
                                }
                                label={opt}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            );

        case "pricing_select": {
            const options = pricingDef?.options ?? [];
            return (
                <FormControl fullWidth size="small">
                    <InputLabel>{label}</InputLabel>
                    <Select
                        value={value}
                        onChange={(e) =>
                            onChange(
                                e.target.value as string,
                            )
                        }
                        label={field.label}
                        disabled={disabled}
                    >
                        {options.map((opt) => (
                            <MenuItem
                                key={opt.id}
                                value={opt.id}
                            >
                                {opt.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );
        }

        case "pricing_quantity": {
            const options = pricingDef?.options ?? [];
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 0.5 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        {options.map((opt) => (
                            <TextField
                                key={opt.id}
                                label={opt.name}
                                type="number"
                                value={String(
                                    quantities?.[opt.id] ??
                                        0,
                                )}
                                onChange={(e) => {
                                    const qty = Math.max(
                                        0,
                                        Math.floor(
                                            Number(
                                                e.target
                                                    .value,
                                            ) || 0,
                                        ),
                                    );
                                    onQuantityChange?.(
                                        opt.id,
                                        qty,
                                    );
                                }}
                                fullWidth
                                size="small"
                                inputProps={{
                                    min: 0,
                                    step: 1,
                                }}
                                disabled={disabled}
                            />
                        ))}
                    </Box>
                </Box>
            );
        }

        case "pricing_multi_select": {
            const msOptions = pricingDef?.options ?? [];
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 0.5 }}
                    >
                        {label}
                    </Typography>
                    {msOptions.map((opt) => (
                        <FormControlLabel
                            key={opt.id}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={
                                        multiSelected?.includes(
                                            opt.id,
                                        ) ?? false
                                    }
                                    onChange={(e) => {
                                        const next =
                                            e.target.checked
                                                ? [
                                                      ...(multiSelected ??
                                                          []),
                                                      opt.id,
                                                  ]
                                                : (
                                                      multiSelected ??
                                                      []
                                                  ).filter(
                                                      (
                                                          s,
                                                      ) =>
                                                          s !==
                                                          opt.id,
                                                  );
                                        onMultiSelectChange?.(
                                            next,
                                        );
                                    }}
                                    disabled={disabled}
                                />
                            }
                            label={opt.name}
                        />
                    ))}
                </Box>
            );
        }

        case "textarea":
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    disabled={disabled}
                />
            );

        default:
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={
                        field.type === "email"
                            ? "email"
                            : field.type === "number"
                              ? "number"
                              : field.type === "date" ||
                                  field.type === "birth_date"
                                ? "date"
                                : "text"
                    }
                    fullWidth
                    size="small"
                    InputLabelProps={
                        field.type === "date" ||
                        field.type === "birth_date"
                            ? { shrink: true }
                            : undefined
                    }
                    disabled={disabled}
                />
            );
    }
}

function personStateToLegacyData(
    state: PersonState,
    fields: FieldMeta[],
): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
        switch (field.type) {
            case "checkbox":
                data[field.name] =
                    state.values[field.name] === "true";
                break;
            case "pricing_quantity":
                data[field.name] = JSON.stringify(
                    state.quantities[field.name] ?? {},
                );
                break;
            case "pricing_multi_select":
                data[field.name] = JSON.stringify(
                    state.multiSelects[field.name] ?? [],
                );
                break;
            default:
                data[field.name] =
                    state.values[field.name] ?? "";
                break;
        }
    }
    return data;
}

export function SubmissionEditForm({
    legacySubmissionId,
    fields: propFields,
    pricingDefinitions,
    people,
    readOnly = false,
}: SubmissionEditFormProps) {
    const fields =
        propFields.length > 0
            ? propFields
            : buildFieldsFromLineItems(people);

    const pricingDefById = new Map(
        pricingDefinitions.map((d) => [d.id, d]),
    );

    const [personStates, setPersonStates] = useState<
        PersonState[]
    >(() => people.map(buildPersonState));

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const updateValue = (
        personIdx: number,
        fieldName: string,
        value: string,
    ) => {
        setPersonStates((prev) => {
            const updated = [...prev];
            updated[personIdx] = {
                ...updated[personIdx],
                values: {
                    ...updated[personIdx].values,
                    [fieldName]: value,
                },
            };
            return updated;
        });
    };

    const updateQuantity = (
        personIdx: number,
        fieldName: string,
        optionId: string,
        qty: number,
    ) => {
        setPersonStates((prev) => {
            const updated = [...prev];
            const fieldQty = {
                ...(updated[personIdx].quantities[
                    fieldName
                ] ?? {}),
            };
            if (qty > 0) {
                fieldQty[optionId] = qty;
            } else {
                delete fieldQty[optionId];
            }
            updated[personIdx] = {
                ...updated[personIdx],
                quantities: {
                    ...updated[personIdx].quantities,
                    [fieldName]: fieldQty,
                },
            };
            return updated;
        });
    };

    const updateMultiSelect = (
        personIdx: number,
        fieldName: string,
        selected: string[],
    ) => {
        setPersonStates((prev) => {
            const updated = [...prev];
            updated[personIdx] = {
                ...updated[personIdx],
                multiSelects: {
                    ...updated[personIdx].multiSelects,
                    [fieldName]: selected,
                },
            };
            return updated;
        });
    };

    const handleRemovePerson = (personIdx: number) => {
        setPersonStates((prev) =>
            prev.filter((_, i) => i !== personIdx),
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const mainState = personStates[0];
        const mainData = mainState
            ? personStateToLegacyData(mainState, fields)
            : {};

        const apStates = personStates.slice(1);
        if (apStates.length > 0) {
            const apFields = fields.filter(
                (f) => f.includeForAP,
            );
            mainData.additionalPeople = apStates.map(
                (s) => personStateToLegacyData(s, apFields),
            );
        }

        const result = await updateSubmissionData(
            legacySubmissionId,
            mainData,
        );

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const mainFields = fields;
    const apFields = fields.filter((f) => f.includeForAP);
    const mainState = personStates[0];
    const apStates = personStates.slice(1);

    return (
        <Box
            component="fieldset"
            disabled={readOnly}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                border: "none",
                p: 0,
                m: 0,
                minWidth: 0,
            }}
        >
            {error && (
                <Alert severity="error">{error}</Alert>
            )}
            {success && (
                <Alert severity="success">
                    Data byla uložena
                </Alert>
            )}

            {mainState &&
                mainFields.map((field) => (
                    <FieldRenderer
                        key={field.id}
                        field={field}
                        value={
                            mainState.values[field.name] ??
                            ""
                        }
                        quantities={
                            mainState.quantities[field.name]
                        }
                        multiSelected={
                            mainState.multiSelects[
                                field.name
                            ]
                        }
                        pricingDef={
                            field.pricingDefinitionId
                                ? pricingDefById.get(
                                      field.pricingDefinitionId,
                                  ) ?? undefined
                                : undefined
                        }
                        onChange={(v) =>
                            updateValue(0, field.name, v)
                        }
                        onQuantityChange={(optId, qty) =>
                            updateQuantity(
                                0,
                                field.name,
                                optId,
                                qty,
                            )
                        }
                        onMultiSelectChange={(sel) =>
                            updateMultiSelect(
                                0,
                                field.name,
                                sel,
                            )
                        }
                        disabled={
                            readOnly || !field.isActive
                        }
                    />
                ))}

            {apFields.length > 0 && apStates.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                    >
                        Další osoby ({apStates.length})
                    </Typography>
                    {apStates.map((state, idx) => {
                        const personIdx = idx + 1;
                        return (
                            <Accordion
                                key={personIdx}
                                defaultExpanded
                            >
                                <AccordionSummary
                                    expandIcon={
                                        <ExpandMore />
                                    }
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems:
                                                "center",
                                            gap: 1,
                                            flex: 1,
                                        }}
                                    >
                                        <Typography>
                                            Osoba č.{" "}
                                            {personIdx + 1}
                                        </Typography>
                                        <Box
                                            sx={{ flex: 1 }}
                                        />
                                        {!readOnly && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(
                                                    e,
                                                ) => {
                                                    e.stopPropagation();
                                                    handleRemovePerson(
                                                        personIdx,
                                                    );
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection:
                                                "column",
                                            gap: 2,
                                        }}
                                    >
                                        {apFields.map(
                                            (field) => (
                                                <FieldRenderer
                                                    key={
                                                        field.id
                                                    }
                                                    field={
                                                        field
                                                    }
                                                    value={
                                                        state
                                                            .values[
                                                            field
                                                                .name
                                                        ] ??
                                                        ""
                                                    }
                                                    quantities={
                                                        state
                                                            .quantities[
                                                            field
                                                                .name
                                                        ]
                                                    }
                                                    multiSelected={
                                                        state
                                                            .multiSelects[
                                                            field
                                                                .name
                                                        ]
                                                    }
                                                    pricingDef={
                                                        field.pricingDefinitionId
                                                            ? pricingDefById.get(
                                                                  field.pricingDefinitionId,
                                                              ) ??
                                                              undefined
                                                            : undefined
                                                    }
                                                    onChange={(
                                                        v,
                                                    ) =>
                                                        updateValue(
                                                            personIdx,
                                                            field.name,
                                                            v,
                                                        )
                                                    }
                                                    onQuantityChange={(
                                                        optId,
                                                        qty,
                                                    ) =>
                                                        updateQuantity(
                                                            personIdx,
                                                            field.name,
                                                            optId,
                                                            qty,
                                                        )
                                                    }
                                                    onMultiSelectChange={(
                                                        sel,
                                                    ) =>
                                                        updateMultiSelect(
                                                            personIdx,
                                                            field.name,
                                                            sel,
                                                        )
                                                    }
                                                    disabled={
                                                        readOnly ||
                                                        !field.isActive
                                                    }
                                                />
                                            ),
                                        )}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>
            )}

            {!readOnly && (
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? "Ukládám..."
                            : "Uložit změny"}
                    </Button>
                </Box>
            )}
        </Box>
    );
}
