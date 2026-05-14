"use client";

import { Box, Chip, TextField, Typography } from "@mui/material";
import {
    BUILTIN_METRIC_LABELS,
    BUILTIN_CURRENCY_METRICS,
    FIELD_AGGREGATION_LABELS,
    isBuiltinMetric,
    type StatCardsBlock,
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

interface StatCardsBlockEditorProps {
    block: StatCardsBlock;
    onChange: (block: StatCardsBlock) => void;
    yearId?: string;
}

export function StatCardsBlockEditor({
    block,
    onChange,
    yearId,
}: StatCardsBlockEditorProps) {
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
                        onChange({
                            ...block,
                            filter: f,
                        })
                    }
                    yearId={yearId}
                />
            </Box>

            {/* Visual preview */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    justifyContent: "center",
                    flex: 1,
                    alignContent: "center",
                    py: 1.5,
                    px: 1,
                    backgroundColor: "grey.50",
                    borderTop: "1px solid",
                    borderColor: "divider",
                }}
            >
                {resolvePreviewCards().map((card, i) => {
                    const cardIcon =
                        block.iconMap?.[card.label] ??
                        block.icon;
                    return (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                px: 1.5,
                                py: 1,
                            }}
                        >
                            <IconPicker
                                value={cardIcon ?? null}
                                onChange={(icon) => {
                                    const map = {
                                        ...(block.iconMap ??
                                            {}),
                                    };
                                    if (icon) {
                                        map[card.label] =
                                            icon;
                                    } else {
                                        delete map[
                                            card.label
                                        ];
                                    }
                                    onChange({
                                        ...block,
                                        iconMap:
                                            Object.keys(
                                                map
                                            ).length > 0
                                                ? map
                                                : undefined,
                                    });
                                }}
                                renderTrigger={(
                                    onClick,
                                    currentIcon
                                ) => (
                                    <Box
                                        onClick={onClick}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            mb: 1,
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            justifyContent:
                                                "center",
                                            borderRadius:
                                                "50%",
                                            border: "1.5px solid",
                                            borderColor:
                                                currentIcon
                                                    ? "divider"
                                                    : "text.disabled",
                                            borderStyle:
                                                currentIcon
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
                                                name={
                                                    currentIcon
                                                }
                                                sx={{
                                                    fontSize:
                                                        "1.5rem",
                                                    color: "text.secondary",
                                                }}
                                            />
                                        ) : (
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                sx={{
                                                    fontSize:
                                                        "0.55rem",
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
                                {card.value}
                                {card.suffix && (
                                    <Typography
                                        component="span"
                                        variant="body2"
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
                                variant="caption"
                                color="text.secondary"
                            >
                                {card.label}
                            </Typography>
                        </Box>
                    );
                })}
                {resolvePreviewCards().length === 0 && (
                    <Typography
                        variant="caption"
                        color="text.disabled"
                    >
                        {stats ? "Žádná data" : "–"}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    function resolveSuffixPreview(optionValue?: string): string | null {
        if (!block.suffix || !stats) return null;
        if (block.suffix.source === "manual") return block.suffix.text ?? null;
        if (block.suffix.source === "capacity") {
            const cap = stats.capacityLimits?.[block.metric]?.[optionValue ?? ""];
            return cap !== undefined ? `/ ${cap}` : null;
        }
        if (block.suffix.source === "total") {
            const fs = stats.fields?.[block.metric];
            return fs ? `/ ${fs.total}` : null;
        }
        return null;
    }

    function resolvePreviewCards(): {
        value: string;
        label: string;
        suffix: string | null;
    }[] {
        if (!stats) return [];
        if (
            source === "builtin" &&
            isBuiltinMetric(block.metric)
        ) {
            const raw =
                stats[block.metric as BuiltinMetric] ?? 0;
            const isCurrency =
                BUILTIN_CURRENCY_METRICS.includes(
                    block.metric as BuiltinMetric
                );
            return [
                {
                    value: isCurrency
                        ? formatPrice(raw)
                        : raw.toLocaleString("cs-CZ"),
                    label:
                        BUILTIN_METRIC_LABELS[
                            block.metric as BuiltinMetric
                        ],
                    suffix: resolveSuffixPreview(),
                },
            ];
        }
        const fs = stats.fields?.[block.metric];
        if (!fs) return [];
        const options = stats.fieldOptions?.[block.metric];
        const counts = fs.counts;

        if (options && options.length > 0) {
            return options.map((option) => ({
                value: (counts[option] ?? 0).toLocaleString("cs-CZ"),
                label: option,
                suffix: resolveSuffixPreview(option),
            }));
        }

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([option, count]) => ({
                value: count.toLocaleString("cs-CZ"),
                label: option,
                suffix: resolveSuffixPreview(option),
            }));
    }
}
