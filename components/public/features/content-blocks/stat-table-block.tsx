import { Box, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import {
    BUILTIN_METRIC_LABELS,
    BUILTIN_CURRENCY_METRICS,
    isBuiltinMetric,
    type StatTableBlock,
    type BuiltinMetric,
} from "@/lib/types/content-blocks";
import type { RegistrationStats } from "@/lib/services/registration";
import { formatPrice } from "@/lib/utils/pricing";

interface StatTableBlockRendererProps {
    block: StatTableBlock;
    stats?: RegistrationStats;
}

interface ColumnData {
    label: string;
    values: string[];
}

function resolveColumns(
    block: StatTableBlock,
    stats?: RegistrationStats
): {
    columns: ColumnData[];
    rows: string[];
    showRowLabels: boolean;
} {
    if (!stats)
        return {
            columns: [],
            rows: [],
            showRowLabels: false,
        };
    const source = block.source ?? "builtin";

    if (source === "builtin") {
        const columns = block.metrics
            .filter((m) => isBuiltinMetric(m.metric))
            .map((m) => {
                const raw =
                    stats[m.metric as BuiltinMetric] ?? 0;
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
                            : raw.toLocaleString("cs-CZ"),
                    ],
                };
            });
        return {
            columns,
            rows: [""],
            showRowLabels: false,
        };
    }

    const hasOptions = block.metrics.some(
        (m) =>
            (stats.fieldOptions?.[m.metric]?.length ??
                0) > 0
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
                stats.fields?.[m.metric]?.counts ?? {}
            )) {
                if (!seen.has(o)) {
                    seen.add(o);
                    allOpts.push(o);
                }
            }
        }

        const columns = block.metrics.map((m) => {
            const fs = stats.fields?.[m.metric];
            return {
                label:
                    m.label ??
                    stats.fieldLabels?.[m.metric] ??
                    m.metric,
                values: allOpts.map((opt) =>
                    (
                        fs?.counts?.[opt] ?? 0
                    ).toLocaleString("cs-CZ")
                ),
            };
        });
        return {
            columns,
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

    const columns = block.metrics.map((m) => {
        const vals =
            stats.fields?.[m.metric]?.values ?? [];
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
    });

    return {
        columns,
        rows: Array.from(
            { length: maxRows },
            (_, i) => String(i)
        ),
        showRowLabels: false,
    };
}

export function StatTableBlockRenderer({
    block,
    stats,
}: StatTableBlockRendererProps) {
    const { columns, rows, showRowLabels } =
        resolveColumns(block, stats);

    if (columns.length === 0) return null;

    const align = block.align ?? "left";
    const justifyContent =
        align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start";

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: justifyContent,
            }}
        >
        {block.title && !showRowLabels && (
            <Typography
                variant="h2"
                component="h2"
                sx={{ mb: 2 }}
            >
                {block.title}
            </Typography>
        )}
        <Box
            component="table"
            sx={{
                borderCollapse: "collapse",
                my: 2,
                "& tbody tr:not(:last-child)": {
                    borderBottom: "1px solid",
                    borderColor: "primary.main",
                },
                "& tbody td:first-of-type": {
                    whiteSpace: "nowrap",
                },
                "& td:not(:last-of-type), & th:not(:last-of-type)":
                    {
                        borderRight: "1px solid",
                        borderColor: (theme: Theme) =>
                            alpha(
                                theme.palette.primary
                                    .main,
                                0.25
                            ),
                    },
            }}
        >
            <Box component="thead">
                <tr>
                    {showRowLabels && (
                        <Box
                            component="th"
                            sx={{
                                p: 1,
                                color: "primary.main",
                                fontWeight: 700,
                                textAlign: "left",
                                textTransform:
                                    "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {block.title ?? ""}
                        </Box>
                    )}
                    {columns.map((col, i) => (
                        <Box
                            component="th"
                            key={i}
                            sx={{
                                p: 1,
                                color: "primary.main",
                                fontWeight: 700,
                                textAlign: showRowLabels
                                    ? "right"
                                    : "left",
                                textTransform:
                                    "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {col.label}
                        </Box>
                    ))}
                </tr>
                <tr>
                    <td
                        colSpan={
                            columns.length +
                            (showRowLabels ? 1 : 0)
                        }
                        style={{ padding: 0 }}
                    >
                        <OrnamentalUnderline
                            sx={{ mx: 0, mt: 0.5 }}
                        />
                    </td>
                </tr>
            </Box>
            <tbody>
                {rows.map((row, ri) => (
                    <tr key={ri}>
                        {showRowLabels && (
                            <Box
                                component="td"
                                sx={{
                                    p: 1,
                                    fontWeight: 600,
                                }}
                            >
                                {row}
                            </Box>
                        )}
                        {columns.map((col, ci) => (
                            <Box
                                component="td"
                                key={ci}
                                sx={{
                                    p: 1,
                                    textAlign:
                                        showRowLabels
                                            ? "right"
                                            : "left",
                                }}
                            >
                                {col.values[ri]}
                            </Box>
                        ))}
                    </tr>
                ))}
            </tbody>
        </Box>
        </Box>
    );
}
