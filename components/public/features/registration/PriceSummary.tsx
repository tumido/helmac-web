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

interface PriceSummaryProps {
    pricingDefinitions: PricingDefinition[];
    allInputFields: InputField[];
    mainValues: SubmissionData;
    additionalPeople: AdditionalPersonData[];
    visibleMainFields: Set<string>;
    visibleAPFieldsPerPerson?: Set<string>[];
}

interface PriceLineItem {
    label: string;
    optionName: string;
    price: number;
}

export function PriceSummary({
    pricingDefinitions,
    allInputFields,
    mainValues,
    additionalPeople,
    visibleMainFields,
    visibleAPFieldsPerPerson,
}: PriceSummaryProps) {
    const summary = useMemo(() => {
        const pricingFields = allInputFields.filter(
            (f) => f.type === "pricing_select" && f.pricingId
        );

        const mainLines: PriceLineItem[] = [];
        const apLines: { personIndex: number; lines: PriceLineItem[] }[] = [];
        let grandTotal = 0;

        for (const field of pricingFields) {
            const def = pricingDefinitions.find((d) => d.id === field.pricingId);
            if (!def) continue;
            const tierIdx = getCurrentTierIndex(def.priceTiers);

            // Main person
            const mainVal = String(mainValues[field.name] ?? "");
            if (mainVal && visibleMainFields.has(field.id)) {
                const opt = def.options.find((o) => o.name === mainVal);
                if (opt) {
                    const price = opt.prices[tierIdx] ?? 0;
                    mainLines.push({ label: def.name, optionName: opt.name, price });
                    grandTotal += price;
                }
            }

            // Additional people
            if (field.includeForAdditionalPeople) {
                additionalPeople.forEach((person, idx) => {
                    const personVal = String(person[field.name] ?? "");
                    if (!personVal) return;

                    // Check if field is visible for this person
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
                    apEntry.lines.push({ label: def.name, optionName: opt.name, price });
                    grandTotal += price;
                });
            }
        }

        return { mainLines, apLines, grandTotal };
    }, [pricingDefinitions, allInputFields, mainValues, additionalPeople, visibleMainFields, visibleAPFieldsPerPerson]);

    // Show only when there's at least one price line
    if (summary.mainLines.length === 0 && summary.apLines.length === 0) {
        return null;
    }

    return (
        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Celková cena
            </Typography>

            {summary.mainLines.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Hlavní osoba
                    </Typography>
                    {summary.mainLines.map((line, i) => (
                        <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                            <Typography variant="body2">
                                {line.label}: {line.optionName}
                            </Typography>
                            {line.price !== 0 && (
                                <Typography variant="body2" fontWeight={500}>
                                    {formatPrice(line.price)}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            )}

            {summary.apLines.map((ap) => (
                <Box key={ap.personIndex} sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Osoba č. {ap.personIndex + 2}
                    </Typography>
                    {ap.lines.map((line, i) => (
                        <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                            <Typography variant="body2">
                                {line.label}: {line.optionName}
                            </Typography>
                            {line.price !== 0 && (
                                <Typography variant="body2" fontWeight={500}>
                                    {formatPrice(line.price)}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            ))}

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Celkem
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                    {formatPrice(summary.grandTotal)}
                </Typography>
            </Box>
        </Paper>
    );
}
