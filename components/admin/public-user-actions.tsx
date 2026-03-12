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
import { deletePublicUser } from "@/lib/actions/public-users";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

interface PublicUserActionsProps {
    userId: string;
    userEmail: string;
    registrationCount: number;
}

export function PublicUserActions({ userId, userEmail, registrationCount }: PublicUserActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deletePublicUser(userId);
        setLoading(false);
        if (result.error) {
            setError(result.error);
            toast.error(result.error);
        } else {
            setDeleteDialogOpen(false);
            toast.success("Účastník byl smazán");
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
                <Tooltip title="Smazat účastníka">
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
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setError(null);
                }}
            >
                <DialogTitle>Smazat účastníka?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat účastníka <strong>{userEmail}</strong>?
                    </DialogContentText>
                    {registrationCount > 0 && (
                        <DialogContentText sx={{ mt: 1 }}>
                            Tento účastník má <strong>{registrationCount}</strong>{" "}
                            {registrationCount === 1 ? "registraci" : registrationCount < 5 ? "registrace" : "registrací"}.
                            Registrace zůstanou zachovány, ale nebudou přiřazeny k žádnému účtu.
                        </DialogContentText>
                    )}
                    <DialogContentText sx={{ mt: 1 }}>
                        Tato akce je nevratná.
                    </DialogContentText>
                    {error && (
                        <DialogContentText color="error" sx={{ mt: 2 }}>
                            {error}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteDialogOpen(false);
                            setError(null);
                        }}
                    >
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
