"use client";

import {
    Box,
    Button,
    IconButton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import {
    Add,
    Delete,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
} from "@mui/icons-material";
import {
    BUILTIN_METRIC_LABELS,
    BUILTIN_CURRENCY_METRICS,
    isBuiltinMetric,
    type StatTableBlock,
    type StatTableAlign,
    type BuiltinMetric,
} from "@/lib/types/content-blocks";
import { formatPrice } from "@/lib/utils/pricing";
import {
    StatMetricEditor,
    useRegistrationFields,
    useRegistrationStats,
} from "./stat-metric-editor";
import { StatFilterEditor } from "./stat-filter-editor";

interface StatTableBlockEditorProps {
    block: StatTableBlock;
    onChange: (block: StatTableBlock) => void;
    yearId?: string;
}

const btnSx = {
    py: 0.25,
    px: 1,
    textTransform: "none",
} as const;

export function StatTableBlockEditor({
    block,
    onChange,
    yearId,
}: StatTableBlockEditorProps) {
    const fields = useRegistrationFields(yearId);
    const stats = useRegistrationStats(
        yearId,
        block.filter as
            | Record<string, unknown>
            | undefined
    );
    const source = block.source ?? "builtin";

    const addMetric = () => {
        const newMetric =
            source === "builtin"
                ? {
                      id: crypto.randomUUID(),
                      source: "builtin" as const,
                      metric: "registrations",
                  }
                : {
                      id: crypto.randomUUID(),
                      source: "field" as const,
                      metric: fields?.[0]?.name ?? "",
                      aggregation: "count" as const,
                  };
        onChange({
            ...block,
            metrics: [...block.metrics, newMetric],
        });
    };

    const removeMetric = (id: string) => {
        onChange({
            ...block,
            metrics: block.metrics.filter(
                (m) => m.id !== id
            ),
        });
    };

    const handleSourceChange = (
        newSource: "builtin" | "field"
    ) => {
        onChange({
            ...block,
            source: newSource,
            metrics:
                newSource === "builtin"
                    ? [
                          {
                              id: crypto.randomUUID(),
                              source: "builtin",
                              metric: "registrations",
                          },
                      ]
                    : [
                          {
                              id: crypto.randomUUID(),
                              source: "field",
                              metric:
                                  fields?.[0]?.name ?? "",
                              aggregation: "count",
                          },
                      ],
        });
    };

    function getPreview(): {
        columns: { label: string; values: string[] }[];
        rows: string[];
        showRowLabels: boolean;
    } {
        if (!stats)
            return {
                columns: [],
                rows: [],
                showRowLabels: false,
            };

        if (source === "builtin") {
            const cols = block.metrics
                .filter((m) =>
                    isBuiltinMetric(m.metric)
                )
                .map((m) => {
                    const raw =
                        stats[
                            m.metric as BuiltinMetric
                        ] ?? 0;
                    const isCurrency =
                        BUILTIN_CURRENCY_METRICS.includes(
                            m.metric as BuiltinMetric
                        );
                    return {
                        label:
                            m.label ??
                            BUILTIN_METRIC_LABELS[
                                m.metric as BuiltinMetric
                            ],
                        values: [
                            isCurrency
                                ? formatPrice(raw)
                                : raw.toLocaleString(
                                      "cs-CZ"
                                  ),
                        ],
                    };
                });
            return {
                columns: cols,
                rows: [""],
                showRowLabels: false,
            };
        }

        const hasOptions = block.metrics.some(
            (m) =>
                (stats.fieldOptions?.[m.metric]
                    ?.length ?? 0) > 0
        );

        if (hasOptions) {
            const allOpts: string[] = [];
            const seen = new Set<string>();
            for (const m of block.metrics) {
                for (const o of stats.fieldOptions?.[
                    m.metric
                ] ?? []) {
                    if (!seen.has(o)) {
                        seen.add(o);
                        allOpts.push(o);
                    }
                }
                for (const o of Object.keys(
                    stats.fields?.[m.metric]
                        ?.counts ?? {}
                )) {
                    if (!seen.has(o)) {
                        seen.add(o);
                        allOpts.push(o);
                    }
                }
            }
            return {
                columns: block.metrics.map((m) => {
                    const fs =
                        stats.fields?.[m.metric];
                    return {
                        label:
                            m.label ??
                            stats.fieldLabels?.[
                                m.metric
                            ] ??
                            m.metric,
                        values: allOpts.map((opt) =>
                            (
                                fs?.counts?.[opt] ?? 0
                            ).toLocaleString("cs-CZ")
                        ),
                    };
                }),
                rows: allOpts,
                showRowLabels: true,
            };
        }

        const maxRows = Math.max(
            ...block.metrics.map(
                (m) =>
                    stats.fields?.[m.metric]?.values
                        ?.length ?? 0
            ),
            0
        );
        return {
            columns: block.metrics.map((m) => {
                const vals =
                    stats.fields?.[m.metric]?.values ??
                    [];
                return {
                    label:
                        m.label ??
                        stats.fieldLabels?.[m.metric] ??
                        m.metric,
                    values: Array.from(
                        { length: maxRows },
                        (_, i) => vals[i] ?? ""
                    ),
                };
            }),
            rows: Array.from(
                { length: maxRows },
                (_, i) => String(i)
            ),
            showRowLabels: false,
        };
    }

    const { columns, rows, showRowLabels } =
        getPreview();

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
            }}
        >
            {/* Toolbar */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "action.hover",
                    flexShrink: 0,
                }}
            >
                <ToggleButtonGroup
                    exclusive
                    value={source}
                    onChange={(_, v) => {
                        if (v) handleSourceChange(v);
                    }}
                    size="small"
                    sx={{
                        flexShrink: 0,
                        "& .MuiToggleButton-root":
                            btnSx,
                    }}
                >
                    <ToggleButton value="builtin">
                        <Typography variant="caption">
                            Globální
                        </Typography>
                    </ToggleButton>
                    <ToggleButton value="field">
                        <Typography variant="caption">
                            Z formuláře
                        </Typography>
                    </ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup
                    exclusive
                    value={block.align ?? "left"}
                    onChange={(_, v) => {
                        if (v)
                            onChange({
                                ...block,
                                align: v as StatTableAlign,
                            });
                    }}
                    size="small"
                    sx={{
                        flexShrink: 0,
                        "& .MuiToggleButton-root": {
                            ...btnSx,
                            px: 0.5,
                        },
                    }}
                >
                    <ToggleButton value="left">
                        <FormatAlignLeft
                            sx={{ fontSize: 14 }}
                        />
                    </ToggleButton>
                    <ToggleButton value="center">
                        <FormatAlignCenter
                            sx={{ fontSize: 14 }}
                        />
                    </ToggleButton>
                    <ToggleButton value="right">
                        <FormatAlignRight
                            sx={{ fontSize: 14 }}
                        />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Column editors */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    p: 1,
                    flexShrink: 0,
                }}
            >
                <TextField
                    value={block.title ?? ""}
                    onChange={(e) =>
                        onChange({
                            ...block,
                            title:
                                e.target.value ||
                                undefined,
                        })
                    }
                    size="small"
                    fullWidth
                    placeholder="Nadpis (volitelné)"
                    sx={{
                        "& .MuiInputBase-root": {
                            fontSize: "0.8rem",
                        },
                    }}
                />
                {block.metrics.map((m) => (
                    <Box
                        key={m.id}
                        sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                        }}
                    >
                        <StatMetricEditor
                            value={m}
                            onChange={(updated) =>
                                onChange({
                                    ...block,
                                    metrics:
                                        block.metrics.map(
                                            (x) =>
                                                x.id ===
                                                m.id
                                                    ? {
                                                          ...x,
                                                          ...updated,
                                                      }
                                                    : x
                                        ),
                                })
                            }
                            yearId={yearId}
                            inline
                            forceSource={source}
                            hideAggregation
                        />
                        {block.metrics.length > 1 && (
                            <IconButton
                                size="small"
                                onClick={() =>
                                    removeMetric(m.id)
                                }
                                sx={{
                                    color: "text.disabled",
                                    flexShrink: 0,
                                    "&:hover": {
                                        color: "error.main",
                                    },
                                }}
                            >
                                <Delete
                                    sx={{
                                        fontSize: 16,
                                    }}
                                />
                            </IconButton>
                        )}
                    </Box>
                ))}
                <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={addMetric}
                >
                    Přidat sloupec
                </Button>
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

            {/* Table preview */}
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: "grey.50",
                    borderTop: "1px solid",
                    borderColor: "divider",
                    overflow: "auto",
                }}
            >
                {block.title && (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            px: 1.5,
                            pt: 1,
                            color: "primary.main",
                        }}
                    >
                        {block.title}
                    </Typography>
                )}
                {columns.length > 0 ? (
                    <Box
                        component="table"
                        sx={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.75rem",
                            "& th, & td": {
                                px: 1.5,
                                py: 0.5,
                                textAlign: "right",
                                "&:first-of-type": {
                                    textAlign: "left",
                                },
                            },
                            "& th": {
                                fontWeight: 600,
                                color: "primary.main",
                                borderBottom:
                                    "1px solid",
                                borderColor: "divider",
                            },
                            "& td": {
                                borderBottom:
                                    "1px solid",
                                borderColor: "divider",
                                color: "text.secondary",
                            },
                            "& tr:last-child td": {
                                borderBottom: "none",
                            },
                        }}
                    >
                        <thead>
                            <tr>
                                {showRowLabels && (
                                    <th />
                                )}
                                {columns.map((col, i) => (
                                    <th key={i}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri}>
                                    {showRowLabels && (
                                        <td
                                            style={{
                                                fontWeight: 500,
                                            }}
                                        >
                                            {row}
                                        </td>
                                    )}
                                    {columns.map(
                                        (col, ci) => (
                                            <td key={ci}>
                                                {
                                                    col
                                                        .values[
                                                        ri
                                                    ]
                                                }
                                            </td>
                                        )
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </Box>
                ) : (
                    <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ p: 1.5, display: "block" }}
                    >
                        {stats ? "Žádná data" : "–"}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
