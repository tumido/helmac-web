import { Box, Typography } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import {
    BUILTIN_METRIC_LABELS,
    BUILTIN_CURRENCY_METRICS,
    isBuiltinMetric,
    type StatSingleBlock,
    type StatSuffix,
    type BuiltinMetric,
} from "@/lib/types/content-blocks";
import type { RegistrationStats } from "@/lib/services/registration";
import { formatPrice } from "@/lib/utils/pricing";

interface StatSingleBlockRendererProps {
    block: StatSingleBlock;
    stats?: RegistrationStats;
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

function resolveValue(
    block: StatSingleBlock,
    stats?: RegistrationStats
): { display: string; label: string; suffix: string | null } {
    const source = block.source ?? "builtin";

    if (source === "builtin" && isBuiltinMetric(block.metric)) {
        const raw = stats?.[block.metric] ?? 0;
        const isCurrency = BUILTIN_CURRENCY_METRICS.includes(
            block.metric as BuiltinMetric
        );
        return {
            display: isCurrency
                ? formatPrice(raw)
                : raw.toLocaleString("cs-CZ"),
            label:
                block.label ??
                BUILTIN_METRIC_LABELS[block.metric],
            suffix: resolveSuffix(block.suffix, block.metric, undefined, stats),
        };
    }

    const fieldStats = stats?.fields?.[block.metric];
    const fieldLabel =
        block.label ??
        stats?.fieldLabels?.[block.metric] ??
        block.metric;

    if (!fieldStats) {
        return { display: "0", label: fieldLabel, suffix: null };
    }

    const agg = block.aggregation ?? "count";
    let raw: number;
    switch (agg) {
        case "sum":
            raw = fieldStats.sum;
            break;
        case "average":
            raw = fieldStats.average;
            break;
        case "enumerate":
        case "count":
        default:
            raw = fieldStats.total;
            break;
    }

    return {
        display: fieldStats.isCurrency
            ? formatPrice(raw)
            : raw.toLocaleString("cs-CZ"),
        label: fieldLabel,
        suffix: resolveSuffix(block.suffix, block.metric, undefined, stats),
    };
}

export function StatSingleBlockRenderer({
    block,
    stats,
}: StatSingleBlockRendererProps) {
    const { display, label, suffix } = resolveValue(block, stats);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                height: "100%",
                px: { xs: 1.5, md: 3 },
                py: { xs: 3, md: 4 },
                borderRadius: 2,
            }}
        >
            {block.icon && (
                <Box
                    className="stat-icon"
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
                        name={block.icon}
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
                {display}
                {suffix && (
                    <Typography
                        component="span"
                        variant="h5"
                        sx={{
                            ml: 0.5,
                            color: "text.secondary",
                            fontWeight: 400,
                        }}
                    >
                        {suffix}
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
                {label}
            </Typography>
        </Box>
    );
}
