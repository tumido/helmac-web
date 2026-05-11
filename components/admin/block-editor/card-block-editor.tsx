"use client";

import { Box, TextField } from "@mui/material";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { CardBlock } from "@/lib/types/content-blocks";

interface CardBlockEditorProps {
    block: CardBlock;
    onChange: (block: CardBlock) => void;
    yearId?: string;
}

export function CardBlockEditor({
    block,
    onChange,
    yearId,
}: CardBlockEditorProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1,
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    flexShrink: 0,
                    overflow: "hidden",
                    maxHeight: 120,
                    "& > div > div": {
                        minHeight: "unset !important",
                        height: "100%",
                        p: 1,
                    },
                    "& img": {
                        maxHeight: "100%",
                        objectFit: "contain",
                    },
                }}
            >
                <ImageUploader
                    value={block.imageUrl}
                    onChange={(url) =>
                        onChange({ ...block, imageUrl: url })
                    }
                />
            </Box>
            <TextField
                size="small"
                label="Nadpis"
                value={block.title}
                onChange={(e) =>
                    onChange({ ...block, title: e.target.value })
                }
                fullWidth
            />
            <Box sx={{ flex: 1, minHeight: 60 }}>
                <RichTextEditor
                    value={block.text}
                    onChange={(text) =>
                        onChange({ ...block, text })
                    }
                    minHeight={60}
                    yearId={yearId}
                    allowedTools={[
                        "formatting",
                        "h3",
                        "lists",
                        "inserts",
                        "undo",
                    ]}
                />
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                <TextField
                    size="small"
                    label="Text tlačítka"
                    value={block.buttonLabel}
                    onChange={(e) =>
                        onChange({ ...block, buttonLabel: e.target.value })
                    }
                    sx={{ flex: 1 }}
                />
                <TextField
                    size="small"
                    label="Odkaz tlačítka"
                    value={block.buttonUrl}
                    onChange={(e) =>
                        onChange({ ...block, buttonUrl: e.target.value })
                    }
                    sx={{ flex: 1 }}
                />
            </Box>
        </Box>
    );
}
