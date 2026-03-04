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
import { deleteUser } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";

interface UserActionsProps {
    userId: string;
    userName: string;
    isCurrentUser: boolean;
}

export function UserActions({ userId, userName, isCurrentUser }: UserActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deleteUser(userId);
        setLoading(false);
        if (result.error) {
            setError(result.error);
            toast.error(result.error);
        } else {
            setDeleteDialogOpen(false);
            toast.success("Uživatel byl smazán");
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
                    title={
                        isCurrentUser
                            ? "Nemůžete smazat sami sebe"
                            : "Smazat uživatele"
                    }
                >
                    <span>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={isCurrentUser}
                        >
                            <Delete />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setError(null);
                }}
            >
                <DialogTitle>Smazat uživatele?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat uživatele <strong>{userName}</strong>?
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
