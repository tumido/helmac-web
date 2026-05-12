"use client";

import { Box, Chip, Divider, Typography } from "@mui/material";
import type { ConditionRule, FormField, PricingDefinition } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import { richContentSx } from "@/lib/utils/rich-content-sx";
import { renderPlaceholderChipsInHtml } from "@/lib/utils/placeholder-html";

const OPERATOR_LABEL: Record<NonNullable<ConditionRule["operator"]>, string> = {
    equals: "=",
    not_equals: "≠",
    is_set: "je vyplněno",
    is_not_set: "není vyplněno",
};

function describeValue(
    rule: ConditionRule,
    field: FormField | undefined,
    pricingDefinitions: PricingDefinition[],
): string {
    if (!rule.value) return "";
    if (!field || !isInputField(field)) return rule.value;
    if (field.type === "checkbox") {
        return rule.value === "true" ? "zaškrtnuto" : "nezaškrtnuto";
    }
    if ((field.type === "pricing_select" || field.type === "pricing_multi_select") && field.pricingId) {
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        const opt = def?.options.find((o) => o.name === rule.value);
        return opt?.name ?? rule.value;
    }
    return rule.value;
}

interface ConditionalSectionsViewProps {
    sections: EmailConditionalSection[];
    availableFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
    placeholders: { key: string; label: string }[];
}

export function ConditionalSectionsView({
    sections,
    availableFields,
    pricingDefinitions = [],
    placeholders,
}: ConditionalSectionsViewProps) {
    if (sections.length === 0) return null;

    const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Podmíněné sekce
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {sorted.map((section, idx) => (
                    <Box
                        key={section.id}
                        sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            p: 2,
                        }}
                    >
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                            Sekce {idx + 1}
                        </Typography>

                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5, mb: 1.5 }}>
                            {section.condition.rules.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">
                                    (bez pravidel — sekce se neodešle)
                                </Typography>
                            ) : (
                                section.condition.rules.map((rule, ruleIdx) => {
                                    const field = availableFields.find((f) => f.id === rule.fieldId);
                                    const fieldLabel =
                                        field && isInputField(field)
                                            ? field.label
                                            : "(nevybráno)";
                                    const opLabel = rule.operator ? OPERATOR_LABEL[rule.operator] : "?";
                                    const showValue = rule.operator !== "is_set" && rule.operator !== "is_not_set";
                                    const valueLabel = showValue
                                        ? describeValue(rule, field, pricingDefinitions)
                                        : "";

                                    return (
                                        <Box
                                            key={ruleIdx}
                                            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                        >
                                            {ruleIdx > 0 && (
                                                <Chip
                                                    label={rule.connector ?? "AND"}
                                                    size="small"
                                                    color={(rule.connector ?? "AND") === "OR" ? "warning" : "primary"}
                                                    sx={{ height: 20, fontSize: "0.65rem" }}
                                                />
                                            )}
                                            <Chip label={fieldLabel} size="small" sx={{ height: 22 }} />
                                            <Typography variant="caption" sx={{ mx: 0.25 }}>
                                                {opLabel}
                                            </Typography>
                                            {showValue && (
                                                <Chip
                                                    label={valueLabel || "—"}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 22 }}
                                                />
                                            )}
                                        </Box>
                                    );
                                })
                            )}
                        </Box>

                        {section.body ? (
                            <Box
                                sx={richContentSx}
                                dangerouslySetInnerHTML={{
                                    __html: renderPlaceholderChipsInHtml(section.body, placeholders),
                                }}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                —
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
