"use client";

import { Box, Chip, TextField, Typography } from "@mui/material";
import {
    BUILTIN_METRIC_LABELS,
    BUILTIN_CURRENCY_METRICS,
    FIELD_AGGREGATION_LABELS,
    isBuiltinMetric,
    type StatSingleBlock,
    type StatSuffixSource,
    type BuiltinMetric,
} from "@/lib/types/content-blocks";
import { GameIcon } from "@/lib/icons";
import { IconPicker } from "@/components/admin/icon-picker";
import { formatPrice } from "@/lib/utils/pricing";
import {
    StatMetricEditor,
    useRegistrationFields,
    useRegistrationStats,
} from "./stat-metric-editor";
import { StatFilterEditor } from "./stat-filter-editor";

interface StatSingleBlockEditorProps {
    block: StatSingleBlock;
    onChange: (block: StatSingleBlock) => void;
    yearId?: string;
}

export function StatSingleBlockEditor({
    block,
    onChange,
    yearId,
}: StatSingleBlockEditorProps) {
    const fields = useRegistrationFields(yearId);
    const stats = useRegistrationStats(
        yearId,
        block.filter as Record<string, unknown> | undefined
    );
    const source = block.source ?? "builtin";

    const defaultLabel =
        source === "builtin" &&
        isBuiltinMetric(block.metric)
            ? BUILTIN_METRIC_LABELS[block.metric]
            : source === "field"
              ? fields?.find(
                    (f) => f.name === block.metric
                )?.label ?? block.metric
              : block.metric;

    const aggLabel = block.aggregation
        ? FIELD_AGGREGATION_LABELS[block.aggregation]
        : "";
    const placeholder =
        source === "field" && aggLabel
            ? `${defaultLabel} (${aggLabel})`
            : defaultLabel;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
            }}
        >
            <StatMetricEditor
                value={{
                    id: block.id,
                    source: block.source,
                    metric: block.metric,
                    aggregation: block.aggregation,
                }}
                onChange={(m) =>
                    onChange({
                        ...block,
                        source: m.source,
                        metric: m.metric,
                        aggregation: m.aggregation,
                    })
                }
                yearId={yearId}
            />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 1,
                    flexShrink: 0,
                }}
            >
                <TextField
                    label="Vlastní popisek"
                    value={block.label ?? ""}
                    onChange={(e) =>
                        onChange({
                            ...block,
                            label:
                                e.target.value ||
                                undefined,
                        })
                    }
                    size="small"
                    fullWidth
                    placeholder={placeholder}
                />
                <Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem", mb: 0.5, display: "block" }}
                    >
                        Doplněk hodnoty
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        {(
                            [
                                { v: undefined, l: "Žádný" },
                                { v: "manual", l: "Ruční" },
                                { v: "capacity", l: "Limit" },
                                { v: "total", l: "Celkem" },
                            ] as const
                        ).map((opt) => (
                            <Chip
                                key={String(opt.v)}
                                label={opt.l}
                                size="small"
                                variant={
                                    (block.suffix?.source ?? undefined) === opt.v
                                        ? "filled"
                                        : "outlined"
                                }
                                color={
                                    (block.suffix?.source ?? undefined) === opt.v
                                        ? "primary"
                                        : "default"
                                }
                                onClick={() =>
                                    onChange({
                                        ...block,
                                        suffix: opt.v
                                            ? { source: opt.v as StatSuffixSource, text: block.suffix?.text }
                                            : undefined,
                                    })
                                }
                                sx={{ fontSize: "0.65rem", height: 22 }}
                            />
                        ))}
                    </Box>
                    {block.suffix?.source === "manual" && (
                        <TextField
                            value={block.suffix.text ?? ""}
                            onChange={(e) =>
                                onChange({
                                    ...block,
                                    suffix: {
                                        ...block.suffix!,
                                        text: e.target.value || undefined,
                                    },
                                })
                            }
                            size="small"
                            fullWidth
                            placeholder="/ 20"
                            sx={{ mt: 0.5 }}
                        />
                    )}
                </Box>
                <StatFilterEditor
                    filter={block.filter}
                    onChange={(f) =>
                        onChange({ ...block, filter: f })
                    }
                    yearId={yearId}
                />
            </Box>

            {/* Visual preview */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    py: 1.5,
                    backgroundColor: "grey.50",
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                <IconPicker
                    value={block.icon ?? null}
                    onChange={(icon) =>
                        onChange({
                            ...block,
                            icon: icon ?? undefined,
                        })
                    }
                    renderTrigger={(onClick, currentIcon) => (
                        <Box
                            onClick={onClick}
                            sx={{
                                width: 48,
                                height: 48,
                                mb: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                border: "1.5px solid",
                                borderColor: currentIcon
                                    ? "divider"
                                    : "text.disabled",
                                borderStyle: currentIcon
                                    ? "solid"
                                    : "dashed",
                                backgroundColor:
                                    "rgba(25, 118, 210, 0.04)",
                                cursor: "pointer",
                                "&:hover": {
                                    borderColor:
                                        "primary.main",
                                },
                            }}
                        >
                            {currentIcon ? (
                                <GameIcon
                                    name={currentIcon}
                                    sx={{
                                        fontSize: "1.5rem",
                                        color: "text.secondary",
                                    }}
                                />
                            ) : (
                                <Typography
                                    variant="caption"
                                    color="text.disabled"
                                    sx={{
                                        fontSize: "0.55rem",
                                    }}
                                >
                                    Ikona
                                </Typography>
                            )}
                        </Box>
                    )}
                />
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "primary.main",
                    }}
                >
                    {resolvePreviewValue()}
                    {resolvePreviewSuffix() && (
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{
                                ml: 0.5,
                                color: "text.secondary",
                                fontWeight: 400,
                            }}
                        >
                            {resolvePreviewSuffix()}
                        </Typography>
                    )}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {block.label ?? defaultLabel}
                </Typography>
            </Box>
        </Box>
    );

    function resolvePreviewValue(): string {
        if (!stats) return "–";
        if (
            source === "builtin" &&
            isBuiltinMetric(block.metric)
        ) {
            const raw =
                stats[block.metric as BuiltinMetric] ?? 0;
            return BUILTIN_CURRENCY_METRICS.includes(
                block.metric as BuiltinMetric
            )
                ? formatPrice(raw)
                : raw.toLocaleString("cs-CZ");
        }
        const fs = stats.fields?.[block.metric];
        if (!fs) return "0";
        const agg = block.aggregation ?? "count";
        const fmt = (n: number) =>
            fs.isCurrency
                ? formatPrice(n)
                : n.toLocaleString("cs-CZ");
        switch (agg) {
            case "sum":
                return fmt(fs.sum);
            case "average":
                return fmt(fs.average);
            default:
                return fs.total.toLocaleString("cs-CZ");
        }
    }

    function resolvePreviewSuffix(): string | null {
        if (!block.suffix || !stats) return null;
        if (block.suffix.source === "manual")
            return block.suffix.text ?? null;
        if (block.suffix.source === "capacity") {
            const cap =
                stats.capacityLimits?.[block.metric]?.[""];
            return cap !== undefined ? `/ ${cap}` : null;
        }
        if (block.suffix.source === "total") {
            const fs = stats.fields?.[block.metric];
            return fs ? `/ ${fs.total}` : null;
        }
        return null;
    }
}
