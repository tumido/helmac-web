"use client";

import { useState, useMemo } from "react";
import { Box, Typography, Collapse } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { PriceSummary, type PriceSummaryProps } from "./PriceSummary";
import { getCurrentTierIndex, formatPrice } from "@/lib/utils/pricing";

export function StickyPriceSummary(props: PriceSummaryProps) {
    const [expanded, setExpanded] = useState(false);

    const grandTotal = useMemo(() => {
        const pricingFields = props.allInputFields.filter(
            (f) =>
                (f.type === "pricing_select" ||
                    f.type === "pricing_quantity" ||
                    f.type === "pricing_multi_select") &&
                f.pricingId
        );

        let total = 0;
        for (const field of pricingFields) {
            const def = props.pricingDefinitions.find(
                (d) => d.id === field.pricingId
            );
            if (!def) continue;
            const tierIdx = getCurrentTierIndex(
                def.usePriceTiers ? props.priceTiers : []
            );

            if (field.type === "pricing_quantity") {
                const parseQty = (val: unknown): Record<string, number> => {
                    try {
                        const parsed = typeof val === "string" ? JSON.parse(val || "{}") : val;
                        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                            return parsed as Record<string, number>;
                        }
                    } catch { /* empty */ }
                    return {};
                };

                const mainQty = parseQty(props.mainValues[field.name]);
                if (props.visibleMainFields.has(field.id)) {
                    for (const opt of def.options) {
                        const qty = Number(mainQty[opt.name]) || 0;
                        if (qty <= 0) continue;
                        const unitPrice = opt.prices[tierIdx] ?? 0;
                        total += unitPrice * qty;
                    }
                }
                if (field.includeForAdditionalPeople) {
                    props.additionalPeople.forEach((person, idx) => {
                        const personQty = parseQty(person[field.name]);
                        if (
                            props.visibleAPFieldsPerPerson?.[idx] &&
                            !props.visibleAPFieldsPerPerson[idx].has(
                                field.id
                            )
                        )
                            return;
                        for (const opt of def.options) {
                            const qty = Number(personQty[opt.name]) || 0;
                            if (qty <= 0) continue;
                            const unitPrice = opt.prices[tierIdx] ?? 0;
                            total += unitPrice * qty;
                        }
                    });
                }
            } else if (field.type === "pricing_multi_select") {
                const parseSelected = (val: unknown): string[] => {
                    try {
                        const arr = JSON.parse(
                            String(val ?? "[]")
                        );
                        return Array.isArray(arr)
                            ? arr.filter(
                                  (v): v is string =>
                                      typeof v === "string"
                              )
                            : [];
                    } catch {
                        return [];
                    }
                };
                const sel = parseSelected(
                    props.mainValues[field.name]
                );
                if (sel.length > 0 && props.visibleMainFields.has(field.id)) {
                    for (const n of sel) {
                        const opt = def.options.find(
                            (o) => o.name === n
                        );
                        if (opt) total += opt.prices[tierIdx] ?? 0;
                    }
                }
                if (field.includeForAdditionalPeople) {
                    props.additionalPeople.forEach((person, idx) => {
                        const pSel = parseSelected(
                            person[field.name]
                        );
                        if (pSel.length === 0) return;
                        if (
                            props.visibleAPFieldsPerPerson?.[idx] &&
                            !props.visibleAPFieldsPerPerson[idx].has(
                                field.id
                            )
                        )
                            return;
                        for (const n of pSel) {
                            const opt = def.options.find(
                                (o) => o.name === n
                            );
                            if (opt)
                                total += opt.prices[tierIdx] ?? 0;
                        }
                    });
                }
            } else {
                const val = String(
                    props.mainValues[field.name] ?? ""
                );
                if (val && props.visibleMainFields.has(field.id)) {
                    const opt = def.options.find(
                        (o) => o.name === val
                    );
                    if (opt) total += opt.prices[tierIdx] ?? 0;
                }
                if (field.includeForAdditionalPeople) {
                    props.additionalPeople.forEach((person, idx) => {
                        const pVal = String(
                            person[field.name] ?? ""
                        );
                        if (!pVal) return;
                        if (
                            props.visibleAPFieldsPerPerson?.[idx] &&
                            !props.visibleAPFieldsPerPerson[idx].has(
                                field.id
                            )
                        )
                            return;
                        const opt = def.options.find(
                            (o) => o.name === pVal
                        );
                        if (opt) total += opt.prices[tierIdx] ?? 0;
                    });
                }
            }
        }
        return Math.max(0, total);
    }, [props]);

    if (grandTotal === 0 && !expanded) return null;

    return (
        <Box
            sx={{
                display: { xs: "block", md: "none" },
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1098,
                backgroundColor: "background.paper",
                borderTop: "2px solid",
                borderColor: "primary.main",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.3)",
            }}
        >
            <Box
                onClick={() => setExpanded((prev) => !prev)}
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3,
                    py: 1.5,
                    cursor: "pointer",
                }}
            >
                <Typography variant="subtitle1" fontWeight={700}>
                    Celkem: {formatPrice(grandTotal)}
                </Typography>
                <ExpandMore
                    sx={{
                        transform: expanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "primary.main",
                    }}
                />
            </Box>
            <Collapse in={expanded}>
                <Box sx={{ px: 3, pb: 2 }}>
                    <PriceSummary {...props} compact />
                </Box>
            </Collapse>
        </Box>
    );
}
