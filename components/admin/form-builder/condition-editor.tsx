"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Chip,
    Collapse,
    ToggleButton,
    ToggleButtonGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    Add,
    Delete,
    ExpandMore,
    ExpandLess,
    AccountTree,
} from "@mui/icons-material";
import type { FormCondition, ConditionRule, FormField, FormElement, InputField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { getBlocksUsingCondition } from "@/lib/utils/condition-validation";

interface ConditionEditorProps {
    conditions: FormCondition[];
    allFields: FormField[];
    elements: FormElement[];
    onChange: (conditions: FormCondition[]) => void;
    pricingDefinitions?: PricingDefinition[];
}

interface BlockInfo {
    conditionName: string;
    blockCount: number;
}

export function ConditionEditor({ conditions, allFields, elements, onChange, pricingDefinitions }: ConditionEditorProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);

    const inputFields = allFields.filter(
        (f): f is InputField => isInputField(f)
    );

    const handleAddCondition = () => {
        const newCondition: FormCondition = {
            id: crypto.randomUUID(),
            name: "",
            rules: [{ type: "field_value", fieldId: "", operator: "equals", value: "" }],
        };
        onChange([...conditions, newCondition]);
        setExpandedId(newCondition.id);
    };

    const handleUpdateCondition = (id: string, updates: Partial<FormCondition>) => {
        onChange(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    };

    const handleDeleteCondition = (id: string) => {
        const blocks = getBlocksUsingCondition(id, elements);
        if (blocks.length > 0) {
            const condition = conditions.find((c) => c.id === id);
            setBlockInfo({
                conditionName: condition?.name || "(nepojmenovaná)",
                blockCount: blocks.length,
            });
            return;
        }
        onChange(conditions.filter((c) => c.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const handleUpdateRule = (conditionId: string, ruleIndex: number, updates: Partial<ConditionRule>) => {
        onChange(conditions.map((c) => {
            if (c.id !== conditionId) return c;
            const newRules = [...c.rules];
            newRules[ruleIndex] = { ...newRules[ruleIndex], ...updates };
            return { ...c, rules: newRules };
        }));
    };

    const handleAddRule = (conditionId: string) => {
        onChange(conditions.map((c) => {
            if (c.id !== conditionId) return c;
            return {
                ...c,
                rules: [...c.rules, { type: "field_value" as const, fieldId: "", operator: "equals" as const, value: "", connector: "AND" as const }],
            };
        }));
    };

    const handleUpdateConnector = (conditionId: string, ruleIndex: number, connector: "AND" | "OR") => {
        onChange(conditions.map((c) => {
            if (c.id !== conditionId) return c;
            const newRules = [...c.rules];
            newRules[ruleIndex] = { ...newRules[ruleIndex], connector };
            return { ...c, rules: newRules };
        }));
    };

    const handleDeleteRule = (conditionId: string, ruleIndex: number) => {
        onChange(conditions.map((c) => {
            if (c.id !== conditionId) return c;
            return { ...c, rules: c.rules.filter((_, i) => i !== ruleIndex) };
        }));
    };

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Podmínky
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Definujte pojmenované podmínky, které poté přetáhněte jako bloky do formuláře.
                Pole uvnitř bloku se zobrazí, pouze pokud podmínka platí.
            </Typography>

            {conditions.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                    Zatím nejsou definovány žádné podmínky.
                </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {conditions.map((condition) => {
                    const isExpanded = expandedId === condition.id;
                    return (
                        <Card key={condition.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    px: 2,
                                    py: 1.5,
                                    cursor: "pointer",
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : condition.id)}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        backgroundColor: "info.main",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <AccountTree sx={{ fontSize: 18, color: "white" }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body1" fontWeight={500} noWrap>
                                        {condition.name || "(nepojmenovaná)"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {condition.rules.length} {condition.rules.length === 1 ? "pravidlo" : "pravidla"}
                                    </Typography>
                                </Box>
                                {isExpanded ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                                <Tooltip title="Smazat podmínku">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCondition(condition.id);
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Collapse in={isExpanded}>
                                <CardContent sx={{ pt: 0 }}>
                                    <TextField
                                        label="Název podmínky"
                                        value={condition.name}
                                        onChange={(e) => handleUpdateCondition(condition.id, { name: e.target.value })}
                                        size="small"
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        placeholder='např. "Děti", "VIP"'
                                    />

                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Pravidla
                                    </Typography>

                                    {/* Column labels */}
                                    {condition.rules.length > 0 && (
                                        <Box sx={{ display: "flex", gap: 1, px: 1.5, mb: 0.5 }}>
                                            <Typography
                                                variant="overline"
                                                color="text.secondary"
                                                sx={{ flex: 1, fontSize: "0.65rem", letterSpacing: 1 }}
                                            >
                                                POLE
                                            </Typography>
                                        </Box>
                                    )}

                                    {condition.rules.map((rule, ruleIdx) => (
                                        <Box key={ruleIdx}>
                                            {ruleIdx > 0 && (
                                                <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                                                    <ToggleButtonGroup
                                                        value={rule.connector ?? "AND"}
                                                        exclusive
                                                        size="small"
                                                        onChange={(_, val) => {
                                                            if (val === "AND" || val === "OR") {
                                                                handleUpdateConnector(condition.id, ruleIdx, val);
                                                            }
                                                        }}
                                                        sx={{
                                                            "& .MuiToggleButton-root": {
                                                                fontSize: "0.65rem",
                                                                height: 20,
                                                                px: 1,
                                                                py: 0,
                                                                lineHeight: 1,
                                                            },
                                                        }}
                                                    >
                                                        <ToggleButton value="AND" color="primary">AND</ToggleButton>
                                                        <ToggleButton value="OR" color="warning">OR</ToggleButton>
                                                    </ToggleButtonGroup>
                                                </Box>
                                            )}
                                            <RuleRow
                                                rule={rule}
                                                inputFields={inputFields}
                                                allFields={allFields}
                                                pricingDefinitions={pricingDefinitions}
                                                onUpdate={(updates) => handleUpdateRule(condition.id, ruleIdx, updates)}
                                                onDelete={() => handleDeleteRule(condition.id, ruleIdx)}
                                                canDelete={condition.rules.length > 1}
                                            />
                                        </Box>
                                    ))}

                                    {/* Action summary */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mt: 1.5,
                                            px: 1.5,
                                            py: 1,
                                            borderRadius: 1,
                                            backgroundColor: (theme) => theme.palette.mode === "light" ? "rgba(46, 125, 50, 0.06)" : "rgba(46, 125, 50, 0.12)",
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem" }}>
                                            Pak provést:
                                        </Typography>
                                        <Chip
                                            label="ZOBRAZIT"
                                            size="small"
                                            color="success"
                                            sx={{ fontSize: "0.65rem", height: 20 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            pole v bloku
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ px: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => handleAddRule(condition.id)}
                                    >
                                        Přidat pravidlo
                                    </Button>
                                </CardActions>
                            </Collapse>
                        </Card>
                    );
                })}
            </Box>

            {/* Add condition area */}
            <Box
                onClick={handleAddCondition}
                sx={{
                    mt: 2,
                    p: 3,
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                    },
                }}
            >
                <Add color="action" />
                <Typography variant="body2" color="text.secondary">
                    Přidat novou podmínku
                </Typography>
            </Box>

            <Dialog open={!!blockInfo} onClose={() => setBlockInfo(null)}>
                <DialogTitle>Nelze smazat podmínku</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Podmínka &bdquo;{blockInfo?.conditionName}&ldquo; je používána v {blockInfo?.blockCount}{" "}
                        {blockInfo?.blockCount === 1 ? "bloku" : "blocích"} ve formuláři.
                        Nejdříve odstraňte všechny bloky této podmínky z formuláře.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBlockInfo(null)} variant="contained">
                        Rozumím
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export interface RuleRowProps {
    rule: ConditionRule;
    inputFields: InputField[];
    allFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
    onUpdate: (updates: Partial<ConditionRule>) => void;
    onDelete: () => void;
    canDelete: boolean;
    /** When true, lays out field/operator/value/delete on a single row. Defaults to false (two-row layout). */
    compact?: boolean;
}

export function RuleRow({ rule, inputFields, allFields, pricingDefinitions, onUpdate, onDelete, canDelete, compact = false }: RuleRowProps) {
    const targetField = allFields.find((f) => f.id === rule.fieldId);
    const targetInput = targetField && isInputField(targetField) ? targetField : null;
    const isQuantityField = targetInput?.type === "pricing_quantity";
    const showValue =
        rule.operator !== "is_set" &&
        rule.operator !== "is_not_set" &&
        rule.operator !== "quantity_any_gt_zero";

    const fieldSelect = (
        <FormControl size="small" sx={{ flex: 1, minWidth: compact ? 140 : undefined }}>
            <InputLabel>Pole</InputLabel>
            <Select
                value={rule.fieldId || ""}
                onChange={(e) => {
                    const newFieldId = e.target.value;
                    const newField = inputFields.find((f) => f.id === newFieldId);
                    const updates: Partial<ConditionRule> = { fieldId: newFieldId, value: "" };
                    if (newField?.type === "pricing_quantity") {
                        updates.operator = "quantity_gt_zero";
                    } else if (rule.operator === "quantity_gt_zero") {
                        updates.operator = "equals";
                    }
                    onUpdate(updates);
                }}
                label="Pole"
            >
                {inputFields.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                        {f.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    const operatorSelect = (
        <FormControl size="small" sx={{ minWidth: compact ? 150 : 160 }}>
            <InputLabel>Operátor</InputLabel>
            <Select
                value={rule.operator || (isQuantityField ? "quantity_gt_zero" : "equals")}
                onChange={(e) => onUpdate({ operator: e.target.value as ConditionRule["operator"] })}
                label="Operátor"
            >
                {isQuantityField
                    ? [
                          <MenuItem key="quantity_gt_zero" value="quantity_gt_zero">konkrétní volba: počet &gt; 0</MenuItem>,
                          <MenuItem key="quantity_any_gt_zero" value="quantity_any_gt_zero">jakákoli volba: počet &gt; 0</MenuItem>,
                      ]
                    : [
                          <MenuItem key="equals" value="equals">se rovná</MenuItem>,
                          <MenuItem key="not_equals" value="not_equals">se nerovná</MenuItem>,
                          <MenuItem key="is_set" value="is_set">je vyplněno</MenuItem>,
                          <MenuItem key="is_not_set" value="is_not_set">není vyplněno</MenuItem>,
                      ]}
            </Select>
        </FormControl>
    );

    const valuePicker = showValue && (
        compact ? (
            <Box sx={{ flex: 1, minWidth: 140 }}>
                <FieldValuePicker
                    targetField={targetInput}
                    pricingDefinitions={pricingDefinitions}
                    value={rule.value || ""}
                    onChange={(value) => onUpdate({ value })}
                />
            </Box>
        ) : (
            <FieldValuePicker
                targetField={targetInput}
                pricingDefinitions={pricingDefinitions}
                value={rule.value || ""}
                onChange={(value) => onUpdate({ value })}
            />
        )
    );

    const deleteButton = canDelete && (
        <Tooltip title="Smazat pravidlo">
            <IconButton size="small" color="error" onClick={onDelete}>
                <Delete fontSize="small" />
            </IconButton>
        </Tooltip>
    );

    if (compact) {
        return (
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    backgroundColor: "action.hover",
                }}
            >
                {fieldSelect}
                {operatorSelect}
                {valuePicker}
                {deleteButton}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                backgroundColor: "action.hover",
            }}
        >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {fieldSelect}
                {deleteButton}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
                {operatorSelect}
                {valuePicker}
            </Box>
        </Box>
    );
}

export function FieldValuePicker({
    targetField,
    pricingDefinitions,
    value,
    onChange,
}: {
    targetField: InputField | null;
    pricingDefinitions?: PricingDefinition[];
    value: string;
    onChange: (value: string) => void;
}) {
    if (!targetField) {
        return (
            <TextField
                label="Hodnota"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                size="small"
                fullWidth
                disabled
                placeholder="Vyberte pole"
            />
        );
    }

    if (targetField.type === "checkbox") {
        return (
            <FormControl size="small" fullWidth>
                <InputLabel>Hodnota</InputLabel>
                <Select value={value} onChange={(e) => onChange(e.target.value)} label="Hodnota">
                    <MenuItem value="true">Zaškrtnuto</MenuItem>
                    <MenuItem value="false">Nezaškrtnuto</MenuItem>
                </Select>
            </FormControl>
        );
    }

    if ((targetField.type === "select" || targetField.type === "radio") && targetField.options) {
        return (
            <FormControl size="small" fullWidth>
                <InputLabel>Hodnota</InputLabel>
                <Select value={value} onChange={(e) => onChange(e.target.value)} label="Hodnota">
                    {targetField.options.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    if (
        (targetField.type === "pricing_select" ||
            targetField.type === "pricing_multi_select" ||
            targetField.type === "pricing_quantity") &&
        targetField.pricingId &&
        pricingDefinitions
    ) {
        const def = pricingDefinitions.find((d) => d.id === targetField.pricingId);
        if (def) {
            const label = targetField.type === "pricing_quantity" ? "Volba" : "Hodnota";
            return (
                <FormControl size="small" fullWidth>
                    <InputLabel>{label}</InputLabel>
                    <Select value={value} onChange={(e) => onChange(e.target.value)} label={label}>
                        {def.options.map((opt) => (
                            <MenuItem key={opt.id} value={opt.name}>{opt.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );
        }
    }

    return (
        <TextField
            label="Hodnota"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            size="small"
            fullWidth
        />
    );
}
