"use client";

import { useState, useTransition } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
} from "@mui/material";
import { Edit, Save, Close } from "@mui/icons-material";
import { updateAdminNote } from "@/lib/actions/registration-submissions";

interface AdminNoteDetailProps {
    submissionId: string;
    adminNote: string | null;
}

export function AdminNoteDetail({ submissionId, adminNote }: AdminNoteDetailProps) {
    const [editing, setEditing] = useState(false);
    const [note, setNote] = useState(adminNote ?? "");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleEdit = () => {
        setNote(adminNote ?? "");
        setError(null);
        setEditing(true);
    };

    const handleCancel = () => {
        setEditing(false);
        setError(null);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateAdminNote(submissionId, note.trim());
            if (result.error) {
                setError(result.error);
            } else {
                setEditing(false);
            }
        });
    };

    if (editing) {
        return (
            <Box>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <TextField
                    autoFocus
                    multiline
                    minRows={3}
                    maxRows={10}
                    fullWidth
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Zadejte poznámku..."
                    sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={isPending}
                    >
                        {isPending ? "Ukládání..." : "Uložit"}
                    </Button>
                    <Button
                        size="small"
                        startIcon={<Close />}
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        Zrušit
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Typography
                variant="body2"
                color={adminNote ? "text.primary" : "text.secondary"}
                sx={{ mb: 2, whiteSpace: "pre-wrap" }}
            >
                {adminNote || "Žádná poznámka"}
            </Typography>
            <Button
                size="small"
                startIcon={<Edit />}
                onClick={handleEdit}
            >
                {adminNote ? "Upravit" : "Přidat poznámku"}
            </Button>
        </Box>
    );
}
