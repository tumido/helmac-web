"use client";

import { useState } from "react";
import {
    Box,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
} from "@mui/material";
import { Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import {
    publishProgramEvent,
    unpublishProgramEvent,
    deleteProgramEvent,
} from "@/lib/actions/program-events";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

interface ProgramEventActionsProps {
    eventId: string;
    isPublished: boolean;
}

export function ProgramEventActions({
    eventId,
    isPublished,
}: ProgramEventActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTogglePublish = async () => {
        setLoading(true);
        setError(null);
        const result = isPublished
            ? await unpublishProgramEvent(eventId)
            : await publishProgramEvent(eventId);
        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(isPublished ? "Událost byla skryta" : "Událost byla publikována");
            router.refresh();
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deleteProgramEvent(eventId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            setError(result.error);
            toast.error(result.error);
        } else {
            toast.success("Událost byla smazána");
            router.refresh();
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip
                    title={isPublished ? "Skrýt událost" : "Publikovat událost"}
                >
                    <IconButton
                        size="small"
                        color={isPublished ? "success" : "default"}
                        onClick={handleTogglePublish}
                    >
                        {isPublished ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Smazat událost">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Smazat událost?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tuto událost? Tato akce je nevratná.
                    </DialogContentText>
                    {error && (
                        <DialogContentText color="error" sx={{ mt: 2 }}>
                            {error}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Zrušit</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
