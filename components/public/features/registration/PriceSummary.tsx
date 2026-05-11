"use client";

import { useMemo } from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import type {
    InputField,
    PricingDefinition,
    SubmissionData,
    AdditionalPersonData,
} from "@/lib/types/registration-form";
import { getCurrentTierIndex, formatPrice } from "@/lib/utils/pricing";

export interface PriceSummaryProps {
    pricingDefinitions: PricingDefinition[];
    priceTiers: string[];
    allInputFields: InputField[];
    mainValues: SubmissionData;
    additionalPeople: AdditionalPersonData[];
    visibleMainFields: Set<string>;
    visibleAPFieldsPerPerson?: Set<string>[];
    compact?: boolean;
}

interface PriceLineItem {
    label: string;
    optionName: string;
    price: number;
}

export function PriceSummary({
    pricingDefinitions,
    priceTiers,
    allInputFields,
    mainValues,
    additionalPeople,
    visibleMainFields,
    visibleAPFieldsPerPerson,
    compact,
}: PriceSummaryProps) {
    const summary = useMemo(() => {
        const pricingFields = allInputFields.filter(
            (f) => (f.type === "pricing_select" || f.type === "pricing_quantity" || f.type === "pricing_multi_select") && f.pricingId
        );

        const mainLines: PriceLineItem[] = [];
        const apLines: { personIndex: number; lines: PriceLineItem[] }[] = [];

        for (const field of pricingFields) {
            const def = pricingDefinitions.find((d) => d.id === field.pricingId);
            if (!def) continue;
            const tierIdx = getCurrentTierIndex(def.usePriceTiers ? priceTiers : []);

            if (field.type === "pricing_quantity") {
                const parseQuantities = (val: unknown): Record<string, number> => {
                    try {
                        const parsed = typeof val === "string" ? JSON.parse(val || "{}") : val;
                        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                            return parsed as Record<string, number>;
                        }
                    } catch { /* empty */ }
                    return {};
                };

                // Main person
                const mainQty = parseQuantities(mainValues[field.name]);
                if (visibleMainFields.has(field.id)) {
                    for (const opt of def.options) {
                        const qty = Number(mainQty[opt.name]) || 0;
                        if (qty <= 0) continue;
                        const unitPrice = opt.prices[tierIdx] ?? 0;
                        const price = unitPrice * qty;
                        mainLines.push({ label: field.label, optionName: `${opt.name} ${qty}x${def.unitName ? ` ${def.unitName}` : ""}`, price });
                    }
                }

                // Additional people
                if (field.includeForAdditionalPeople) {
                    additionalPeople.forEach((person, idx) => {
                        const personQty = parseQuantities(person[field.name]);
                        if (visibleAPFieldsPerPerson && visibleAPFieldsPerPerson[idx]) {
                            if (!visibleAPFieldsPerPerson[idx].has(field.id)) return;
                        }
                        for (const opt of def.options) {
                            const qty = Number(personQty[opt.name]) || 0;
                            if (qty <= 0) continue;
                            const unitPrice = opt.prices[tierIdx] ?? 0;
                            const price = unitPrice * qty;
                            let apEntry = apLines.find((a) => a.personIndex === idx);
                            if (!apEntry) {
                                apEntry = { personIndex: idx, lines: [] };
                                apLines.push(apEntry);
                            }
                            apEntry.lines.push({ label: field.label, optionName: `${opt.name} ${qty}x${def.unitName ? ` ${def.unitName}` : ""}`, price });
                        }
                    });
                }
            } else if (field.type === "pricing_multi_select") {
                const parseSelected = (val: unknown): string[] => {
                    try {
                        const arr = JSON.parse(String(val ?? "[]"));
                        return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
                    } catch { return []; }
                };

                // Main person
                const mainSelected = parseSelected(mainValues[field.name]);
                if (mainSelected.length > 0 && visibleMainFields.has(field.id)) {
                    for (const optName of mainSelected) {
                        const opt = def.options.find((o) => o.name === optName);
                        if (opt) {
                            const price = opt.prices[tierIdx] ?? 0;
                            mainLines.push({ label: field.label, optionName: opt.name, price });
                        }
                    }
                }

                // Additional people
                if (field.includeForAdditionalPeople) {
                    additionalPeople.forEach((person, idx) => {
                        const personSelected = parseSelected(person[field.name]);
                        if (personSelected.length === 0) return;
                        if (visibleAPFieldsPerPerson && visibleAPFieldsPerPerson[idx]) {
                            if (!visibleAPFieldsPerPerson[idx].has(field.id)) return;
                        }
                        for (const optName of personSelected) {
                            const opt = def.options.find((o) => o.name === optName);
                            if (!opt) continue;
                            const price = opt.prices[tierIdx] ?? 0;
                            let apEntry = apLines.find((a) => a.personIndex === idx);
                            if (!apEntry) {
                                apEntry = { personIndex: idx, lines: [] };
                                apLines.push(apEntry);
                            }
                            apEntry.lines.push({ label: field.label, optionName: opt.name, price });
                        }
                    });
                }
            } else {
                // pricing_select
                const mainVal = String(mainValues[field.name] ?? "");
                if (mainVal && visibleMainFields.has(field.id)) {
                    const opt = def.options.find((o) => o.name === mainVal);
                    if (opt) {
                        const price = opt.prices[tierIdx] ?? 0;
                        mainLines.push({ label: field.label, optionName: opt.name, price });
                    }
                }

                // Additional people
                if (field.includeForAdditionalPeople) {
                    additionalPeople.forEach((person, idx) => {
                        const personVal = String(person[field.name] ?? "");
                        if (!personVal) return;
                        if (visibleAPFieldsPerPerson && visibleAPFieldsPerPerson[idx]) {
                            if (!visibleAPFieldsPerPerson[idx].has(field.id)) return;
                        }
                        const opt = def.options.find((o) => o.name === personVal);
                        if (!opt) return;
                        const price = opt.prices[tierIdx] ?? 0;
                        let apEntry = apLines.find((a) => a.personIndex === idx);
                        if (!apEntry) {
                            apEntry = { personIndex: idx, lines: [] };
                            apLines.push(apEntry);
                        }
                        apEntry.lines.push({ label: field.label, optionName: opt.name, price });
                    });
                }
            }
        }

        const mainTotal = Math.max(
            0,
            mainLines.reduce((sum, l) => sum + l.price, 0)
        );
        const apTotals = apLines.map((ap) => ({
            ...ap,
            total: Math.max(
                0,
                ap.lines.reduce((sum, l) => sum + l.price, 0)
            ),
        }));
        const grandTotal =
            mainTotal +
            apTotals.reduce((sum, ap) => sum + ap.total, 0);

        return { mainLines, apLines: apTotals, grandTotal };
    }, [pricingDefinitions, priceTiers, allInputFields, mainValues, additionalPeople, visibleMainFields, visibleAPFieldsPerPerson]);

    const isEmpty = summary.mainLines.length === 0 &&
        summary.apLines.every((a) => a.lines.length === 0);

    const content = (
        <>
            {!compact && (
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Celková cena
                </Typography>
            )}

            {isEmpty && !compact && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, fontStyle: "italic" }}
                >
                    Zatím žádné položky
                </Typography>
            )}

            {summary.mainLines.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                    {summary.apLines.length > 0 && (
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                                mb: 0.5,
                                pb: 0.5,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                color: "primary.main",
                            }}
                        >
                            Hlavní osoba
                        </Typography>
                    )}
                    {summary.mainLines.map((line, i) => (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: 1,
                                mb: 0.75,
                            }}
                        >
                            <Typography variant="body2">
                                {line.label}: {line.optionName}
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                noWrap
                                sx={{ flexShrink: 0 }}
                            >
                                {formatPrice(line.price)}
                            </Typography>
                        </Box>
                    ))}
                    {summary.apLines.length > 0 && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: 1,
                                mt: 0.5,
                                pt: 0.5,
                                borderTop: "1px dashed",
                                borderColor: "divider",
                            }}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                            >
                                Celkem za osobu
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                sx={{ flexShrink: 0 }}
                            >
                                {formatPrice(
                                    Math.max(
                                        0,
                                        summary.mainLines.reduce(
                                            (s, l) => s + l.price,
                                            0
                                        )
                                    )
                                )}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {summary.apLines.map((ap) => (
                <Box key={ap.personIndex} sx={{ mb: 1.5 }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                            mb: 0.5,
                            pb: 0.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            color: "primary.main",
                        }}
                    >
                        Osoba č. {ap.personIndex + 2}
                    </Typography>
                    {ap.lines.map((line, i) => (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: 1,
                                mb: 0.75,
                            }}
                        >
                            <Typography variant="body2">
                                {line.label}: {line.optionName}
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                noWrap
                                sx={{ flexShrink: 0 }}
                            >
                                {formatPrice(line.price)}
                            </Typography>
                        </Box>
                    ))}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 1,
                            mt: 0.5,
                            pt: 0.5,
                            borderTop: "1px dashed",
                            borderColor: "divider",
                        }}
                    >
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                        >
                            Mezisoučet
                        </Typography>
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ flexShrink: 0 }}
                        >
                            {formatPrice(ap.total)}
                        </Typography>
                    </Box>
                </Box>
            ))}

            <Divider sx={{ my: 1.5 }} />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 2,
                }}
            >
                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    noWrap
                >
                    Celkem
                </Typography>
                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    noWrap
                >
                    {formatPrice(summary.grandTotal)}
                </Typography>
            </Box>
        </>
    );

    if (compact) {
        return content;
    }

    return (
        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
            {content}
        </Paper>
    );
}

export { formatPrice } from "@/lib/utils/pricing";
