"use client";

import { useState } from "react";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { Save } from "@mui/icons-material";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { updateRegistrationSuccessContent } from "@/lib/actions/years";

interface RegistrationSuccessContentEditorProps {
    yearId: string;
    initialContent: string | null;
}

export function RegistrationSuccessContentEditor({
    yearId,
    initialContent,
}: RegistrationSuccessContentEditorProps) {
    const [content, setContent] = useState(initialContent ?? "");
    const [savedContent, setSavedContent] = useState(initialContent ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const dirty = content !== savedContent;

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.set("content", content);

        const result = await updateRegistrationSuccessContent(yearId, formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSavedContent(content);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }

        setSaving(false);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Obsah byl uložen</Alert>}

            <RichTextEditor
                value={content}
                onChange={setContent}
                format="markdown"
                minHeight={400}
                placeholder="Zadejte text, který se zobrazí po úspěšné registraci..."
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                    variant="contained"
                    startIcon={
                        saving ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            <Save />
                        )
                    }
                    onClick={handleSave}
                    disabled={saving || !dirty}
                >
                    {saving ? "Ukládám..." : "Uložit"}
                </Button>
            </Box>
        </Box>
    );
}
