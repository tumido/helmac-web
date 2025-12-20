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
import { Delete, Archive, Unarchive, Star } from "@mui/icons-material";
import {
    setActiveYear,
    archiveYear,
    unarchiveYear,
    deleteYear,
} from "@/lib/actions/years";
import { useRouter } from "next/navigation";

interface YearActionsProps {
    yearId: string;
    isActive: boolean;
    isArchived: boolean;
}

export function YearActions({ yearId, isActive, isArchived }: YearActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSetActive = async () => {
        setLoading(true);
        setError(null);
        const result = await setActiveYear(yearId);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            router.refresh();
        }
    };

    const handleArchive = async () => {
        setLoading(true);
        setError(null);
        const result = await archiveYear(yearId);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            router.refresh();
        }
    };

    const handleUnarchive = async () => {
        setLoading(true);
        setError(null);
        const result = await unarchiveYear(yearId);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            router.refresh();
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deleteYear(yearId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            setError(result.error);
        } else {
            router.refresh();
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: "flex", gap: 0.5 }}>
                {!isActive && (
                    <Tooltip title="Nastavit jako aktivni">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={handleSetActive}
                        >
                            <Star />
                        </IconButton>
                    </Tooltip>
                )}

                {!isActive && !isArchived && (
                    <Tooltip title="Archivovat">
                        <IconButton
                            size="small"
                            color="default"
                            onClick={handleArchive}
                        >
                            <Archive />
                        </IconButton>
                    </Tooltip>
                )}

                {isArchived && (
                    <Tooltip title="Obnovit z archivu">
                        <IconButton
                            size="small"
                            color="default"
                            onClick={handleUnarchive}
                        >
                            <Unarchive />
                        </IconButton>
                    </Tooltip>
                )}

                {!isActive && (
                    <Tooltip title="Smazat">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Delete />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Smazat rocnik?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tento rocnik? Tato akce je nevratna
                        a smaze vsechny stranky, novinky a alba spojene s timto
                        rocnikem.
                    </DialogContentText>
                    {error && (
                        <DialogContentText color="error" sx={{ mt: 2 }}>
                            {error}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Zrusit
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
