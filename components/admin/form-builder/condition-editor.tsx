"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Collapse,
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
                rules: [...c.rules, { type: "field_value" as const, fieldId: "", operator: "equals" as const, value: "" }],
            };
        }));
    };

    const handleDeleteRule = (conditionId: string, ruleIndex: number) => {
        onChange(conditions.map((c) => {
            if (c.id !== conditionId) return c;
            return { ...c, rules: c.rules.filter((_, i) => i !== ruleIndex) };
        }));
    };

    const handleChangeRuleType = (conditionId: string, ruleIndex: number, newType: "field_value" | "capacity") => {
        if (newType === "field_value") {
            handleUpdateRule(conditionId, ruleIndex, {
                type: "field_value",
                fieldId: "",
                operator: "equals",
                value: "",
                maxCount: undefined,
            });
        } else {
            handleUpdateRule(conditionId, ruleIndex, {
                type: "capacity",
                fieldId: "",
                operator: undefined,
                value: "",
                maxCount: 10,
            });
        }
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
                        <Card key={condition.id} variant="outlined">
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    cursor: "pointer",
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : condition.id)}
                            >
                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                                    {condition.name || "(nepojmenovaná)"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {condition.rules.length} {condition.rules.length === 1 ? "pravidlo" : "pravidla"}
                                </Typography>
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
                                        Pravidla (všechna musí platit)
                                    </Typography>

                                    {condition.rules.map((rule, ruleIdx) => (
                                        <RuleRow
                                            key={ruleIdx}
                                            rule={rule}
                                            inputFields={inputFields}
                                            allFields={allFields}
                                            pricingDefinitions={pricingDefinitions}
                                            onUpdate={(updates) => handleUpdateRule(condition.id, ruleIdx, updates)}
                                            onChangeType={(type) => handleChangeRuleType(condition.id, ruleIdx, type)}
                                            onDelete={() => handleDeleteRule(condition.id, ruleIdx)}
                                            canDelete={condition.rules.length > 1}
                                        />
                                    ))}
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

            <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddCondition}
                sx={{ mt: 2 }}
                fullWidth
            >
                Přidat podmínku
            </Button>

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

interface RuleRowProps {
    rule: ConditionRule;
    inputFields: InputField[];
    allFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
    onUpdate: (updates: Partial<ConditionRule>) => void;
    onChangeType: (type: "field_value" | "capacity") => void;
    onDelete: () => void;
    canDelete: boolean;
}

function RuleRow({ rule, inputFields, allFields, pricingDefinitions, onUpdate, onChangeType, onDelete, canDelete }: RuleRowProps) {
    const targetField = allFields.find((f) => f.id === rule.fieldId);
    const targetInput = targetField && isInputField(targetField) ? targetField : null;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1.5,
                mb: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                backgroundColor: "action.hover",
            }}
        >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                        value={rule.type}
                        onChange={(e) => onChangeType(e.target.value as "field_value" | "capacity")}
                        label="Typ"
                    >
                        <MenuItem value="field_value">Hodnota pole</MenuItem>
                        <MenuItem value="capacity">Kapacita</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Pole</InputLabel>
                    <Select
                        value={rule.fieldId || ""}
                        onChange={(e) => onUpdate({ fieldId: e.target.value, value: "" })}
                        label="Pole"
                    >
                        {inputFields.map((f) => (
                            <MenuItem key={f.id} value={f.id}>
                                {f.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {canDelete && (
                    <Tooltip title="Smazat pravidlo">
                        <IconButton size="small" color="error" onClick={onDelete}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {rule.type === "field_value" && (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Operátor</InputLabel>
                        <Select
                            value={rule.operator || "equals"}
                            onChange={(e) => onUpdate({ operator: e.target.value as "equals" | "not_equals" })}
                            label="Operátor"
                        >
                            <MenuItem value="equals">se rovná</MenuItem>
                            <MenuItem value="not_equals">se nerovná</MenuItem>
                        </Select>
                    </FormControl>
                    <FieldValuePicker
                        targetField={targetInput}
                        pricingDefinitions={pricingDefinitions}
                        value={rule.value || ""}
                        onChange={(value) => onUpdate({ value })}
                    />
                </Box>
            )}

            {rule.type === "capacity" && (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <FieldValuePicker
                        targetField={targetInput}
                        pricingDefinitions={pricingDefinitions}
                        value={rule.value || ""}
                        onChange={(value) => onUpdate({ value })}
                    />
                    <TextField
                        label="Max. počet"
                        type="number"
                        size="small"
                        value={rule.maxCount ?? ""}
                        onChange={(e) => onUpdate({ maxCount: parseInt(e.target.value) || 1 })}
                        sx={{ width: 120 }}
                        inputProps={{ min: 1 }}
                    />
                </Box>
            )}
        </Box>
    );
}

function FieldValuePicker({
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

    if (targetField.type === "pricing_select" && targetField.pricingId && pricingDefinitions) {
        const def = pricingDefinitions.find((d) => d.id === targetField.pricingId);
        if (def) {
            return (
                <FormControl size="small" fullWidth>
                    <InputLabel>Hodnota</InputLabel>
                    <Select value={value} onChange={(e) => onChange(e.target.value)} label="Hodnota">
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
