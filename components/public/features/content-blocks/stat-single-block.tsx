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

interface SuffixInfo {
    prefix?: string;
    displayOverride?: string;
    text: string;
}

function resolveSuffix(
    suffix: StatSuffix | undefined,
    metric: string,
    optionValue: string | undefined,
    currentValue: number,
    stats?: RegistrationStats
): SuffixInfo | null {
    if (!suffix) return null;
    if (suffix.source === "manual") {
        return suffix.text ? { text: suffix.text } : null;
    }
    if (suffix.source === "capacity" && stats) {
        const limits = stats.capacityLimits?.[metric];
        if (!limits) return null;
        if (optionValue !== undefined) {
            const cap = limits[optionValue];
            return cap !== undefined
                ? { text: `/ ${cap}` }
                : null;
        }
        const values = Object.values(limits);
        if (values.length === 0) return null;
        const total = values.reduce((a, b) => a + b, 0);
        return { text: `/ ${total}` };
    }
    if (suffix.source === "total" && stats) {
        const limits = stats.capacityLimits?.[metric];
        if (!limits) return null;
        let cap: number;
        if (optionValue !== undefined) {
            const optCap = limits[optionValue];
            if (optCap === undefined) return null;
            cap = optCap;
        } else {
            const values = Object.values(limits);
            if (values.length === 0) return null;
            cap = values.reduce((a, b) => a + b, 0);
        }
        const remaining = Math.max(0, cap - currentValue);
        return {
            prefix: "Zbývá",
            displayOverride: remaining.toLocaleString("cs-CZ"),
            text: `z ${cap.toLocaleString("cs-CZ")}`,
        };
    }
    return null;
}

function resolveValue(
    block: StatSingleBlock,
    stats?: RegistrationStats
): {
    display: string;
    label: string;
    prefix: string | null;
    suffix: string | null;
} {
    const source = block.source ?? "builtin";

    if (source === "builtin" && isBuiltinMetric(block.metric)) {
        const raw = stats?.[block.metric] ?? 0;
        const isCurrency = BUILTIN_CURRENCY_METRICS.includes(
            block.metric as BuiltinMetric
        );
        const suffixInfo = resolveSuffix(
            block.suffix, block.metric, undefined, raw, stats
        );
        return {
            display: suffixInfo?.displayOverride
                ?? (isCurrency
                    ? formatPrice(raw)
                    : raw.toLocaleString("cs-CZ")),
            label:
                block.label ??
                BUILTIN_METRIC_LABELS[block.metric],
            prefix: suffixInfo?.prefix ?? null,
            suffix: suffixInfo?.text ?? null,
        };
    }

    const filteredOption = block.filter?.fieldFilters?.find(
        (ff) => ff.fieldName === block.metric
    )?.value;

    const fieldStats = stats?.fields?.[block.metric];
    const fieldLabel =
        block.label ??
        stats?.fieldLabels?.[block.metric] ??
        block.metric;

    if (!fieldStats) {
        return {
            display: "0",
            label: fieldLabel,
            prefix: null,
            suffix: null,
        };
    }

    const agg = block.aggregation ?? "count";
    let raw: number;
    if (filteredOption !== undefined && agg === "count") {
        raw = fieldStats.counts?.[filteredOption] ?? 0;
    } else {
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
    }

    const suffixInfo = resolveSuffix(
        block.suffix, block.metric, filteredOption, raw, stats
    );

    const showAsCurrency =
        fieldStats.isCurrency && agg === "sum";

    return {
        display: suffixInfo?.displayOverride
            ?? (showAsCurrency
                ? formatPrice(raw)
                : raw.toLocaleString("cs-CZ")),
        label: fieldLabel,
        prefix: suffixInfo?.prefix ?? null,
        suffix: suffixInfo?.text ?? null,
    };
}

export function StatSingleBlockRenderer({
    block,
    stats,
}: StatSingleBlockRendererProps) {
    const { display, label, prefix, suffix } = resolveValue(block, stats);

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
                {prefix && (
                    <Typography
                        component="span"
                        variant="h5"
                        sx={{
                            mr: 0.5,
                            color: "text.secondary",
                            fontWeight: 400,
                        }}
                    >
                        {prefix}
                    </Typography>
                )}
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
