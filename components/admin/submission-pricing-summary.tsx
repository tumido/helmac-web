"use client";

import { Box, Typography, Chip } from "@mui/material";
import type { PricingSummaryData } from "@/lib/types/registration-form";
import { formatPrice } from "@/lib/utils/pricing";

interface SubmissionPricingSummaryProps {
    pricingSummary: PricingSummaryData | null;
    variableSymbol: string | null;
    totalPrice: number | null;
}

export function SubmissionPricingSummary({
    pricingSummary,
    variableSymbol,
    totalPrice,
}: SubmissionPricingSummaryProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {variableSymbol && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Variabilní symbol
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ fontFamily: "monospace", letterSpacing: 1 }}
                    >
                        {variableSymbol}
                    </Typography>
                </Box>
            )}

            {totalPrice != null && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Celková cena
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                        {formatPrice(totalPrice)}
                    </Typography>
                </Box>
            )}

            {pricingSummary && pricingSummary.tiers.length > 0 && (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Cenové hladiny
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {pricingSummary.tiers.map((tier, idx) => {
                            const isApplicable = idx === pricingSummary.applicableTierIndex;
                            const label = tier.tierDate
                                ? `Do ${new Date(tier.tierDate).toLocaleDateString("cs-CZ")}`
                                : "Na místě";

                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        fontWeight={isApplicable ? 700 : 400}
                                    >
                                        {label}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={isApplicable ? 700 : 400}
                                        >
                                            {formatPrice(tier.totalPrice)}
                                        </Typography>
                                        {isApplicable && (
                                            <Chip label="Aktuální" size="small" color="primary" />
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {!variableSymbol && totalPrice == null && !pricingSummary && (
                <Typography variant="body2" color="text.secondary">
                    Žádné cenové údaje
                </Typography>
            )}
        </Box>
    );
}
