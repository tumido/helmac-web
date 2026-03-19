"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { Delete, Edit, NetworkCheck } from "@mui/icons-material";
import { deleteEmailAccount, testEmailAccount } from "@/lib/actions/email-accounts";
import { useSnackbar } from "notistack";

interface EmailAccountCardProps {
    account: {
        id: string;
        email: string;
        label: string | null;
        isMain: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    onEdit: (id: string) => void;
}

export function EmailAccountCard({ account, onEdit }: EmailAccountCardProps) {
    const { enqueueSnackbar } = useSnackbar();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [testing, setTesting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        const result = await deleteEmailAccount(account.id);
        setDeleting(false);
        setDeleteOpen(false);

        if (result?.error) {
            enqueueSnackbar(
                typeof result.error === "string" ? result.error : "Nepodařilo se smazat účet",
                { variant: "error" },
            );
        } else {
            enqueueSnackbar("Emailový účet byl smazán", { variant: "success" });
        }
    };

    const handleTest = async () => {
        setTesting(true);
        const result = await testEmailAccount(account.id);
        setTesting(false);

        if (result.success) {
            enqueueSnackbar("Připojení k SMTP serveru je funkční", { variant: "success" });
        } else {
            enqueueSnackbar(result.error || "Test selhal", { variant: "error" });
        }
    };

    return (
        <>
            <Card variant="outlined">
                <CardContent>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Typography variant="h6" component="span">
                                    {account.email}
                                </Typography>
                                {account.isMain && (
                                    <Chip label="Hlavní" color="primary" size="small" />
                                )}
                            </Box>
                            {account.label && (
                                <Typography variant="body2" color="text.secondary">
                                    {account.label}
                                </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                SMTP: smtp.seznam.cz:465
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Test připojení">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={handleTest}
                                        disabled={testing}
                                    >
                                        {testing ? <CircularProgress size={20} /> : <NetworkCheck />}
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Upravit">
                                <IconButton size="small" onClick={() => onEdit(account.id)}>
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Smazat">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => setDeleteOpen(true)}
                                        disabled={account.isMain}
                                    >
                                        <Delete />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Smazat emailový účet</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat emailový účet <strong>{account.email}</strong>?
                        Šablony emailů, které tento účet používají, budou přepnuty na hlavní účet.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
                        Zrušit
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        disabled={deleting}
                    >
                        {deleting ? "Mazání..." : "Smazat"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
