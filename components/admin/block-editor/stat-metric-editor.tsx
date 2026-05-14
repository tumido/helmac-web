"use client";

import { useEffect, useState, useTransition } from "react";
import {
    Box,
    MenuItem,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    Tag,
    Functions,
    PercentOutlined,
    FormatListBulleted,
} from "@mui/icons-material";
import {
    BUILTIN_METRIC_LABELS,
    FIELD_AGGREGATION_LABELS,
    type BuiltinMetric,
    type FieldAggregation,
    type StatMetricConfig,
} from "@/lib/types/content-blocks";
import {
    getRegistrationFields,
    getRegistrationStatsPreview,
    type RegistrationFieldInfo,
} from "@/lib/actions/registration-fields";
import type { RegistrationStats } from "@/lib/services/registration";

const BUILTIN_METRICS = Object.entries(
    BUILTIN_METRIC_LABELS
) as [BuiltinMetric, string][];

const AGGREGATION_ICONS: Record<
    FieldAggregation,
    React.ReactNode
> = {
    count: <Tag sx={{ fontSize: 14 }} />,
    sum: <Functions sx={{ fontSize: 14 }} />,
    average: <PercentOutlined sx={{ fontSize: 14 }} />,
    enumerate: (
        <FormatListBulleted sx={{ fontSize: 14 }} />
    ),
};

const btnSx = {
    py: 0.25,
    px: 1,
    textTransform: "none",
} as const;

interface StatMetricEditorProps {
    value: StatMetricConfig;
    onChange: (value: StatMetricConfig) => void;
    yearId?: string;
    inline?: boolean;
    forceSource?: "builtin" | "field";
    hideAggregation?: boolean;
}

export function useRegistrationFields(yearId?: string) {
    const [fields, setFields] = useState<
        RegistrationFieldInfo[] | null
    >(null);
    const [, startLoad] = useTransition();

    useEffect(() => {
        if (!yearId) return;
        startLoad(async () => {
            const result =
                await getRegistrationFields(yearId);
            setFields(result);
        });
    }, [yearId]);

    return fields;
}

export function useRegistrationStats(
    yearId?: string,
    filter?: Record<string, unknown>
) {
    const [stats, setStats] =
        useState<RegistrationStats | null>(null);
    const filterKey = JSON.stringify(filter ?? null);
    const [, startLoad] = useTransition();

    useEffect(() => {
        if (!yearId) return;
        const parsed = JSON.parse(filterKey);
        const hasFilter =
            parsed &&
            (parsed.statuses?.length ||
                parsed.isPaid !== undefined ||
                parsed.fieldFilters?.length);
        startLoad(async () => {
            const result =
                await getRegistrationStatsPreview(
                    yearId,
                    hasFilter ? parsed : undefined
                );
            setStats(result);
        });
    }, [yearId, filterKey]);

    return stats;
}

export function StatMetricEditor({
    value,
    onChange,
    yearId,
    inline,
    forceSource,
    hideAggregation,
}: StatMetricEditorProps) {
    const fields = useRegistrationFields(yearId);
    const source = forceSource ?? value.source ?? "builtin";

    const showSourceToggle = !forceSource;
    const showAggregation =
        source === "field" && !hideAggregation;
    const showToolbar = showSourceToggle || showAggregation;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                ...(inline
                    ? { flex: 1, minWidth: 0 }
                    : { flexShrink: 0 }),
            }}
        >
            {showToolbar && (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    ...(inline
                        ? {
                              backgroundColor:
                                  "action.hover",
                              borderRadius: 0.5,
                              px: 0.5,
                              py: 0.25,
                          }
                        : {
                              px: 1,
                              py: 0.5,
                              borderBottom: "1px solid",
                              borderColor: "divider",
                              backgroundColor:
                                  "action.hover",
                              flexShrink: 0,
                          }),
                }}
            >
                {!forceSource && (
                    <ToggleButtonGroup
                        exclusive
                        value={source}
                        onChange={(_, v) => {
                            if (!v) return;
                            if (v === "builtin") {
                                onChange({
                                    ...value,
                                    source: "builtin",
                                    metric: "registrations",
                                    aggregation: undefined,
                                });
                            } else {
                                onChange({
                                    ...value,
                                    source: "field",
                                    metric:
                                        fields?.[0]?.name ??
                                        "",
                                    aggregation: "count",
                                });
                            }
                        }}
                        size="small"
                        sx={{
                            flexShrink: 0,
                            "& .MuiToggleButton-root": btnSx,
                        }}
                    >
                        <ToggleButton value="builtin">
                            <Typography variant="caption">Globální</Typography>
                        </ToggleButton>
                        <ToggleButton value="field">
                            <Typography variant="caption">Z formuláře</Typography>
                        </ToggleButton>
                    </ToggleButtonGroup>
                )}

                {source === "field" && !hideAggregation && (
                    <>
                        <Box sx={{ flex: 1 }} />
                        <ToggleButtonGroup
                            exclusive
                            value={
                                value.aggregation ??
                                "count"
                            }
                            onChange={(_, v) => {
                                if (!v) return;
                                onChange({
                                    ...value,
                                    aggregation:
                                        v as FieldAggregation,
                                });
                            }}
                            size="small"
                            sx={{
                                flexShrink: 0,
                                "& .MuiToggleButton-root":
                                    {
                                        ...btnSx,
                                        px: 0.5,
                                    },
                            }}
                        >
                            {(
                                Object.keys(
                                    FIELD_AGGREGATION_LABELS
                                ) as FieldAggregation[]
                            ).map((v) => (
                                <ToggleButton
                                    key={v}
                                    value={v}
                                >
                                    <Tooltip
                                        title={
                                            FIELD_AGGREGATION_LABELS[
                                                v
                                            ]
                                        }
                                    >
                                        <Box
                                            sx={{
                                                display:
                                                    "flex",
                                            }}
                                        >
                                            {
                                                AGGREGATION_ICONS[
                                                    v
                                                ]
                                            }
                                        </Box>
                                    </Tooltip>
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </>
                )}
            </Box>
            )}

            <TextField
                select
                value={value.metric}
                onChange={(e) =>
                    onChange({
                        ...value,
                        metric: e.target.value,
                    })
                }
                size="small"
                fullWidth
                sx={{
                    ...(inline
                        ? { mt: 0.5 }
                        : { px: 1, pt: 0.5 }),
                    "& .MuiInputBase-root": {
                        fontSize: "0.8rem",
                    },
                }}
            >
                {source === "builtin"
                    ? BUILTIN_METRICS.map(
                          ([v, label]) => (
                              <MenuItem
                                  key={v}
                                  value={v}
                              >
                                  {label}
                              </MenuItem>
                          )
                      )
                    : (fields?.map((f) => (
                          <MenuItem
                              key={f.name}
                              value={f.name}
                          >
                              {f.label}
                          </MenuItem>
                      )) ?? (
                          <MenuItem value="" disabled>
                              Načítání...
                          </MenuItem>
                      ))}
            </TextField>

        </Box>
    );
}
