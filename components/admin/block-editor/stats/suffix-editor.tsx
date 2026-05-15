"use client";

import { Box, Chip, TextField, Typography } from "@mui/material";
import type {
    StatSuffix,
    StatSuffixSource,
} from "@/lib/types/content-blocks";

const SUFFIX_OPTIONS: {
    v: StatSuffixSource | undefined;
    l: string;
}[] = [
    { v: undefined, l: "Žádný" },
    { v: "manual", l: "Ruční" },
    { v: "capacity", l: "Limit" },
    { v: "total", l: "Zbývá" },
];

interface StatSuffixEditorProps {
    value?: StatSuffix;
    onChange: (suffix: StatSuffix | undefined) => void;
}

export function StatSuffixEditor({
    value,
    onChange,
}: StatSuffixEditorProps) {
    return (
        <Box>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    fontSize: "0.7rem",
                    mb: 0.5,
                    display: "block",
                }}
            >
                Doplněk hodnoty
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    gap: 0.5,
                    alignItems: "center",
                }}
            >
                {SUFFIX_OPTIONS.map((opt) => (
                    <Chip
                        key={String(opt.v)}
                        label={opt.l}
                        size="small"
                        variant={
                            (value?.source ?? undefined) ===
                            opt.v
                                ? "filled"
                                : "outlined"
                        }
                        color={
                            (value?.source ?? undefined) ===
                            opt.v
                                ? "primary"
                                : "default"
                        }
                        onClick={() =>
                            onChange(
                                opt.v
                                    ? {
                                          source: opt.v,
                                          text: value?.text,
                                      }
                                    : undefined
                            )
                        }
                        sx={{ fontSize: "0.65rem", height: 22 }}
                    />
                ))}
            </Box>
            {value?.source === "manual" && (
                <TextField
                    value={value.text ?? ""}
                    onChange={(e) =>
                        onChange({
                            ...value,
                            text:
                                e.target.value || undefined,
                        })
                    }
                    size="small"
                    fullWidth
                    placeholder="/ 20"
                    sx={{ mt: 0.5 }}
                />
            )}
        </Box>
    );
}
