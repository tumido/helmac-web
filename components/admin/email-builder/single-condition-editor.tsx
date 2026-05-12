"use client";

import {
    Box,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import type { ConditionRule, FormCondition, FormElement, FormField, InputField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { RuleRow } from "@/components/admin/form-builder/condition-editor";

interface SingleConditionEditorProps {
    condition: FormCondition;
    allFields: FormField[];
    elements?: FormElement[];
    pricingDefinitions?: PricingDefinition[];
    onChange: (next: FormCondition) => void;
}

export function SingleConditionEditor({
    condition,
    allFields,
    pricingDefinitions,
    onChange,
}: SingleConditionEditorProps) {
    const inputFields = allFields.filter(
        (f): f is InputField => isInputField(f),
    );

    const updateRule = (index: number, updates: Partial<ConditionRule>) => {
        const newRules = [...condition.rules];
        newRules[index] = { ...newRules[index], ...updates };
        onChange({ ...condition, rules: newRules });
    };

    const updateConnector = (index: number, connector: "AND" | "OR") => {
        updateRule(index, { connector });
    };

    const deleteRule = (index: number) => {
        onChange({ ...condition, rules: condition.rules.filter((_, i) => i !== index) });
    };

    const addRule = () => {
        const isFirst = condition.rules.length === 0;
        onChange({
            ...condition,
            rules: [
                ...condition.rules,
                {
                    type: "field_value",
                    fieldId: "",
                    operator: "equals",
                    value: "",
                    ...(isFirst ? {} : { connector: "AND" as const }),
                },
            ],
        });
    };

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Podmínka
            </Typography>

            {condition.rules.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Přidejte alespoň jedno pravidlo. Sekce bude odeslána pouze pokud podmínka platí.
                </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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
                                            updateConnector(ruleIdx, val);
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
                            onUpdate={(updates) => updateRule(ruleIdx, updates)}
                            onDelete={() => deleteRule(ruleIdx)}
                            canDelete
                            compact
                        />
                    </Box>
                ))}
            </Box>

            <Box sx={{ mt: 1 }}>
                <Button size="small" startIcon={<Add />} onClick={addRule}>
                    Přidat pravidlo
                </Button>
            </Box>
        </Box>
    );
}
