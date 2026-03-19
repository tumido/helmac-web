"use client";

import { useState, useTransition } from "react";
import { Box, Button, Alert } from "@mui/material";
import { Save } from "@mui/icons-material";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { updateGdprContent } from "@/lib/actions/site-settings";

interface GdprEditorProps {
    initialContent: string;
}

export function GdprEditor({ initialContent }: GdprEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateGdprContent(content);
            if (result.error) {
                setFeedback({ type: "error", message: result.error });
            } else {
                setFeedback({ type: "success", message: "GDPR obsah byl uložen" });
            }
        });
    };

    return (
        <Box>
            {feedback && (
                <Alert
                    severity={feedback.type}
                    onClose={() => setFeedback(null)}
                    sx={{ mb: 2 }}
                >
                    {feedback.message}
                </Alert>
            )}

            <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Zadejte obsah GDPR / ochrana osobních údajů..."
                minHeight={400}
            />

            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={isPending}
                >
                    {isPending ? "Ukládání..." : "Uložit"}
                </Button>
            </Box>
        </Box>
    );
}
