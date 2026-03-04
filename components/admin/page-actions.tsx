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
import { publishPage, unpublishPage, deletePage } from "@/lib/actions/pages";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

interface PageActionsProps {
    pageId: string;
    isPublished: boolean;
}

export function PageActions({ pageId, isPublished }: PageActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTogglePublish = async () => {
        setLoading(true);
        setError(null);
        const result = isPublished
            ? await unpublishPage(pageId)
            : await publishPage(pageId);
        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(isPublished ? "Stránka byla skryta" : "Stránka byla publikována");
            router.refresh();
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deletePage(pageId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            setError(result.error);
            toast.error(result.error);
        } else {
            toast.success("Stránka byla smazána");
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
                <Tooltip title={isPublished ? "Skrýt stránku" : "Publikovat stránku"}>
                    <IconButton
                        size="small"
                        color={isPublished ? "success" : "default"}
                        onClick={handleTogglePublish}
                    >
                        {isPublished ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Smazat stránku">
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
                <DialogTitle>Smazat stránku?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tuto stránku? Tato akce je nevratná.
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
