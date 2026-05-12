"use client";

import type { MutableRefObject } from "react";
import { Box, Chip, Typography } from "@mui/material";
import type { Editor } from "@/components/admin/rich-text-editor";
import { builderPalette as p } from "./palette";

interface PlaceholderStripProps {
    placeholders: { key: string; label: string }[];
    editorRef: MutableRefObject<Editor | null>;
    onFallbackInsert?: (key: string) => void;
}

export function PlaceholderStrip({ placeholders, editorRef, onFallbackInsert }: PlaceholderStripProps) {
    if (placeholders.length === 0) return null;

    const insert = (ph: { key: string; label: string }) => {
        const editor = editorRef.current;
        if (!editor) {
            onFallbackInsert?.(ph.key);
            return;
        }
        editor
            .chain()
            .focus()
            .insertContent({ type: "placeholder", attrs: { key: ph.key, label: ph.label } })
            .run();
    };

    return (
        <Box
            sx={{
                mt: "14px",
                p: "12px 14px",
                backgroundColor: p.surface2,
                border: `1px dashed ${p.line}`,
                borderRadius: "10px",
            }}
        >
            <Typography sx={{ fontSize: 11, color: p.ink3, mb: 1 }}>
                Vlož placeholder do textu kliknutím:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {placeholders.map((ph) => (
                    <Chip
                        key={ph.key}
                        label={ph.label}
                        size="small"
                        variant="outlined"
                        onClick={() => insert(ph)}
                        sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            height: 22,
                            borderColor: p.line,
                            color: p.ink2,
                            backgroundColor: "white",
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: p.indigoSoft,
                                color: p.indigoInk,
                                borderColor: p.indigo,
                            },
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
}
