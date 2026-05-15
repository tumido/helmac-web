import { Box, Divider, Typography } from "@mui/material";
import { formatPrice } from "@/lib/utils/pricing";
import {
    type PricingLineItem,
    type PricingLineGroup,
} from "@/lib/utils/pricing-line-items";

export function PriceBreakdown({
    mainLines,
    apLines,
    totalPrice,
}: {
    mainLines: PricingLineItem[];
    apLines: PricingLineGroup[];
    totalPrice: number | null;
}) {
    const hasAP = apLines.some((g) => g.lines.length > 0);
    const hasLines = mainLines.length > 0 || hasAP;

    if (!hasLines && !totalPrice) return null;

    return (
        <Box>
            <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: "primary.main", mb: 1.5 }}
            >
                Rozpis ceny
            </Typography>
            {mainLines.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                    {hasAP && (
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
                    {mainLines.map((line, i) => (
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
                </Box>
            )}

            {apLines.map((group) =>
                group.lines.length === 0 ? null : (
                    <Box key={group.personIndex} sx={{ mb: 1.5 }}>
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
                            Osoba č. {group.personIndex + 2}
                        </Typography>
                        {group.lines.map((line, i) => (
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
                    </Box>
                )
            )}

            {totalPrice != null && totalPrice > 0 && (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 2,
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                            Celkem
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {formatPrice(totalPrice)}
                        </Typography>
                    </Box>
                </>
            )}
        </Box>
    );
}
