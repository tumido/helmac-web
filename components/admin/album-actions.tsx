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
import { publishAlbum, unpublishAlbum, deleteAlbum } from "@/lib/actions/albums";
import { useRouter } from "next/navigation";

interface AlbumActionsProps {
    albumId: string;
    isPublished: boolean;
}

export function AlbumActions({ albumId, isPublished }: AlbumActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTogglePublish = async () => {
        setLoading(true);
        setError(null);
        const result = isPublished
            ? await unpublishAlbum(albumId)
            : await publishAlbum(albumId);
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
        const result = await deleteAlbum(albumId);
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
            <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title={isPublished ? "Skryt album" : "Publikovat album"}>
                    <IconButton
                        size="small"
                        color={isPublished ? "success" : "default"}
                        onClick={handleTogglePublish}
                    >
                        {isPublished ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </Tooltip>

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
                        Opravdu chcete smazat toto album? Tato akce je nevratna a
                        smaze vsechny obrazky v albu.
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
