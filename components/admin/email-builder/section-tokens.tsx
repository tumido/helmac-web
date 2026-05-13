"use client";

import { Box, Typography } from "@mui/material";
import type { ConditionRule, FormField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import { builderPalette as p } from "./palette";

const OPERATOR_SYMBOL: Record<NonNullable<ConditionRule["operator"]>, string> = {
    equals: "=",
    not_equals: "≠",
    is_set: "vyplněno",
    is_not_set: "nevyplněno",
    quantity_gt_zero: "počet > 0",
    quantity_any_gt_zero: "jakákoli > 0",
};

function describeValue(
    rule: ConditionRule,
    field: FormField | undefined,
    pricingDefinitions: PricingDefinition[],
): string {
    if (!rule.value) return "";
    if (!field || !isInputField(field)) return rule.value;
    if (field.type === "checkbox") {
        return rule.value === "true" ? "ano" : "ne";
    }
    if ((field.type === "pricing_select" || field.type === "pricing_multi_select") && field.pricingId) {
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        const opt = def?.options.find((o) => o.name === rule.value);
        return opt?.name ?? rule.value;
    }
    return rule.value;
}

interface SectionTokensProps {
    rules: ConditionRule[];
    availableFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
    /** Render a single neutral "Základní text" chip instead of rules (used for the base section). */
    baseLabel?: string;
}

const fieldChip = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 500,
    px: "6px",
    py: "2px",
    borderRadius: "4px",
    backgroundColor: p.field,
    color: p.fieldInk,
    whiteSpace: "nowrap" as const,
    lineHeight: 1.3,
};

const valueChip = {
    ...fieldChip,
    backgroundColor: p.value,
    color: p.valueInk,
};

const valueChipNeg = {
    ...fieldChip,
    backgroundColor: p.neg,
    color: p.negInk,
};

const emptyChip = {
    ...fieldChip,
    backgroundColor: p.surface3,
    color: p.ink2,
    fontStyle: "italic" as const,
};

const opStyle = {
    color: p.ink3,
    fontStyle: "italic" as const,
    fontSize: 11,
    px: "1px",
};

const connectorStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    color: p.ink3,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    px: "3px",
};

const connectorStyleOr = {
    ...connectorStyle,
    color: p.or,
};

export function SectionTokens({
    rules,
    availableFields,
    pricingDefinitions = [],
    baseLabel,
}: SectionTokensProps) {
    if (baseLabel) {
        return (
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px" }}>
                <Box component="span" sx={emptyChip}>{baseLabel}</Box>
            </Box>
        );
    }

    if (rules.length === 0) {
        return (
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px" }}>
                <Box component="span" sx={emptyChip}>bez pravidel</Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px" }}>
            {rules.map((rule, ruleIdx) => {
                const field = availableFields.find((f) => f.id === rule.fieldId);
                const fieldLabel = field && isInputField(field) ? field.label : "(nevybráno)";
                const operator = rule.operator ?? "equals";
                const opLabel = OPERATOR_SYMBOL[operator];
                const showValue =
                    operator !== "is_set" &&
                    operator !== "is_not_set" &&
                    operator !== "quantity_any_gt_zero";
                const valueLabel = showValue ? describeValue(rule, field, pricingDefinitions) : "";
                const isNeg = operator === "not_equals";
                const connector = rule.connector ?? "AND";

                return (
                    <Box
                        key={ruleIdx}
                        component="span"
                        sx={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                    >
                        {ruleIdx > 0 && (
                            <Typography
                                component="span"
                                sx={connector === "OR" ? connectorStyleOr : connectorStyle}
                            >
                                {connector === "OR" ? "or" : "and"}
                            </Typography>
                        )}
                        <Box component="span" sx={fieldChip}>{fieldLabel}</Box>
                        <Typography component="span" sx={opStyle}>{opLabel}</Typography>
                        {showValue && (
                            <Box component="span" sx={isNeg ? valueChipNeg : valueChip}>
                                {valueLabel || "—"}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
