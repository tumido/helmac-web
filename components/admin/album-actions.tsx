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
import { Delete } from "@mui/icons-material";
import { deleteAlbum } from "@/lib/actions/albums";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

interface AlbumActionsProps {
    albumId: string;
}

export function AlbumActions({ albumId }: AlbumActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deleteAlbum(albumId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            setError(result.error);
            toast.error(result.error);
        } else {
            toast.success("Album bylo smazáno");
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
                <Tooltip title="Smazat album">
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
                <DialogTitle>Smazat album?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat toto album? Tato akce je nevratná a
                        smaže všechny obrázky v albu.
                    </DialogContentText>
                    {error && (
                        <DialogContentText color="error" sx={{ mt: 2 }}>
                            {error}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Zrušit
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
