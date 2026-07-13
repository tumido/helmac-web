"use client";

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from "@mui/material";

export interface DeletionBlockInfo {
    title: string;
    message: string;
    details: string[];
}

interface DeleteFormDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteFormDialog({
    open,
    onClose,
    onConfirm,
}: DeleteFormDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Smazat formulář?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Tato akce smaže registrační formulář a všechny přijaté
                    registrace. Tuto akci nelze vrátit.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Zrušit</Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Smazat
                </Button>
            </DialogActions>
        </Dialog>
    );
}

interface DeletionBlockDialogProps {
    info: DeletionBlockInfo | null;
    onClose: () => void;
}

export function DeletionBlockDialog({
    info,
    onClose,
}: DeletionBlockDialogProps) {
    return (
        <Dialog open={!!info} onClose={onClose}>
            <DialogTitle>{info?.title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{info?.message}</DialogContentText>
                {info?.details && (
                    <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                        {info.details.map((d, i) => (
                            <li key={i}>
                                <Typography variant="body2">{d}</Typography>
                            </li>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Rozumím
                </Button>
            </DialogActions>
        </Dialog>
    );
}
