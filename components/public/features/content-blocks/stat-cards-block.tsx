import { Box, Typography } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import {
    BUILTIN_METRIC_LABELS,
    BUILTIN_CURRENCY_METRICS,
    isBuiltinMetric,
    type StatCardsBlock,
    type StatSuffix,
    type BuiltinMetric,
} from "@/lib/types/content-blocks";
import type { RegistrationStats } from "@/lib/services/registration";
import { formatPrice } from "@/lib/utils/pricing";

interface StatCardsBlockRendererProps {
    block: StatCardsBlock;
    stats?: RegistrationStats;
}

interface CardData {
    display: string;
    label: string;
    icon?: string;
    suffix?: string | null;
}

function resolveSuffix(
    suffix: StatSuffix | undefined,
    metric: string,
    optionValue: string | undefined,
    stats?: RegistrationStats
): string | null {
    if (!suffix) return null;
    if (suffix.source === "manual") return suffix.text ?? null;
    if (suffix.source === "capacity" && stats) {
        const cap = stats.capacityLimits?.[metric]?.[optionValue ?? ""];
        return cap !== undefined ? `/ ${cap}` : null;
    }
    if (suffix.source === "total" && stats) {
        const fs = stats.fields?.[metric];
        return fs ? `/ ${fs.total}` : null;
    }
    return null;
}

function resolveCards(
    block: StatCardsBlock,
    stats?: RegistrationStats
): CardData[] {
    const source = block.source ?? "builtin";

    if (source === "builtin" && isBuiltinMetric(block.metric)) {
        const raw = stats?.[block.metric] ?? 0;
        const isCurrency = BUILTIN_CURRENCY_METRICS.includes(
            block.metric as BuiltinMetric
        );
        return [
            {
                display: isCurrency
                    ? formatPrice(raw)
                    : raw.toLocaleString("cs-CZ"),
                label: BUILTIN_METRIC_LABELS[block.metric],
            },
        ];
    }

    const fieldStats = stats?.fields?.[block.metric];
    if (!fieldStats) return [];

    const options = stats?.fieldOptions?.[block.metric];
    const counts = fieldStats.counts;

    if (options && options.length > 0) {
        return options.map((option) => ({
            display: (counts[option] ?? 0).toLocaleString("cs-CZ"),
            label: option,
            icon: block.iconMap?.[option] ?? block.icon,
            suffix: resolveSuffix(block.suffix, block.metric, option, stats),
        }));
    }

    const entries = Object.entries(counts);
    if (entries.length === 0) return [];

    return entries
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => ({
            display: count.toLocaleString("cs-CZ"),
            label: option,
            icon: block.iconMap?.[option] ?? block.icon,
            suffix: resolveSuffix(block.suffix, block.metric, option, stats),
        }));
}

export function StatCardsBlockRenderer({
    block,
    stats,
}: StatCardsBlockRendererProps) {
    const cards = resolveCards(block, stats);
    const count = cards.length || 1;

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs:
                        count > 1
                            ? "repeat(2, 1fr)"
                            : "1fr",
                    sm: `repeat(${Math.min(count, 3)}, 1fr)`,
                    md: `repeat(${Math.min(count, 4)}, 1fr)`,
                },
                height: "100%",
                alignItems: "stretch",
            }}
        >
            {cards.map((card, i) => (
                <Box
                    key={i}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        px: { xs: 1.5, md: 3 },
                        py: { xs: 3, md: 4 },
                    }}
                >
                    {card.icon && (
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                mx: "auto",
                                mb: 2.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                border: "2px solid",
                                borderColor: "divider",
                                backgroundColor:
                                    "rgba(201, 162, 39, 0.03)",
                            }}
                        >
                            <GameIcon
                                name={card.icon}
                                sx={{
                                    fontSize: "2rem",
                                    color: "text.secondary",
                                }}
                            />
                        </Box>
                    )}
                    <Typography
                        variant="h4"
                        component="p"
                        sx={{
                            mb: 0.5,
                            color: "text.primary",
                        }}
                    >
                        {card.display}
                        {card.suffix && (
                            <Typography
                                component="span"
                                variant="h5"
                                sx={{
                                    ml: 0.5,
                                    color: "text.secondary",
                                    fontWeight: 400,
                                }}
                            >
                                {card.suffix}
                            </Typography>
                        )}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            lineHeight: 1.7,
                            opacity: 0.7,
                            color: "text.secondary",
                        }}
                    >
                        {card.label}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}
