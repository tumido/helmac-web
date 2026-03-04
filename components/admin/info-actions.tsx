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
import { deleteInfoSection } from "@/lib/actions/info";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

interface InfoActionsProps {
    infoId: string;
    infoTitle: string;
}

export function InfoActions({ infoId, infoTitle }: InfoActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteInfoSection(infoId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Info sekce byla smazána");
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
                <Tooltip title="Smazat info sekci">
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
                <DialogTitle>Smazat info sekci?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat info sekci <strong>&quot;{infoTitle}&quot;</strong>?
                        <br />
                        Tato akce je nevratná.
                    </DialogContentText>
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
