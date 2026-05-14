"use client";

import { Button, Paper, Typography } from "@mui/material";
import {
    ContentCopy,
    Save,
    TuneOutlined,
    Visibility,
} from "@mui/icons-material";

interface Props {
    saving: boolean;
    previewSaving: boolean;
    canSave: boolean;
    canPreview: boolean;
    previewToken: string | null;
    readOnly?: boolean;
    onSave: () => void;
    onPreview: () => void;
}

export function FormBuilderToolbar({
    saving,
    previewSaving,
    canSave,
    canPreview,
    previewToken,
    readOnly = false,
    onSave,
    onPreview,
}: Props) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                borderRadius: 2,
            }}
        >
            <TuneOutlined color="primary" />
            <Typography variant="h6" sx={{ flex: 1 }}>
                Registrační formulář
            </Typography>
            <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={onPreview}
                disabled={!canPreview || previewSaving}
            >
                {previewSaving ? "Ukládám..." : "Náhled"}
            </Button>
            {previewToken && (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => {
                        const url = `${window.location.origin}/nahled/${previewToken}`;
                        navigator.clipboard.writeText(url);
                    }}
                >
                    Kopírovat odkaz
                </Button>
            )}
            {!readOnly && (
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={onSave}
                    disabled={saving || !canSave}
                >
                    {saving ? "Ukládám..." : "Uložit formulář"}
                </Button>
            )}
        </Paper>
    );
}
