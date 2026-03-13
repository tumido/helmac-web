"use client";

import { useState, useTransition } from "react";
import {
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tooltip,
    Alert,
} from "@mui/material";
import { StickyNote2 } from "@mui/icons-material";
import { updateAdminNote } from "@/lib/actions/registration-submissions";

interface AdminNoteButtonProps {
    submissionId: string;
    adminNote: string | null;
}

export function AdminNoteButton({ submissionId, adminNote }: AdminNoteButtonProps) {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState(adminNote ?? "");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const hasNote = !!adminNote;

    const handleOpen = () => {
        setNote(adminNote ?? "");
        setError(null);
        setOpen(true);
    };

    const handleClose = () => {
        if (!isPending) {
            setOpen(false);
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateAdminNote(submissionId, note.trim());
            if (result.error) {
                setError(result.error);
            } else {
                setOpen(false);
            }
        });
    };

    return (
        <>
            <Tooltip title={hasNote ? "Poznámka" : "Přidat poznámku"}>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpen();
                    }}
                >
                    <StickyNote2
                        fontSize="small"
                        color={hasNote ? "primary" : "disabled"}
                    />
                </IconButton>
            </Tooltip>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>Poznámka admina</DialogTitle>
                <DialogContent>
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
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isPending}>
                        Zrušit
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={isPending}
                    >
                        {isPending ? "Ukládání..." : "Uložit"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
