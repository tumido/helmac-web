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
import { deleteProgramDay } from "@/lib/actions/program-days";
import { useRouter } from "next/navigation";

interface ProgramDayActionsProps {
    dayId: string;
    eventsCount: number;
}

export function ProgramDayActions({
    dayId,
    eventsCount,
}: ProgramDayActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deleteProgramDay(dayId);
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
                <Tooltip title="Smazat den">
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
                <DialogTitle>Smazat den programu?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tento den programu?
                        {eventsCount > 0 && (
                            <>
                                {" "}
                                <strong>
                                    Bude smazano take {eventsCount}{" "}
                                    {eventsCount === 1
                                        ? "udalost"
                                        : eventsCount < 5
                                          ? "udalosti"
                                          : "udalosti"}
                                    .
                                </strong>
                            </>
                        )}
                        <br />
                        Tato akce je nevratna.
                    </DialogContentText>
                    {error && (
                        <DialogContentText color="error" sx={{ mt: 2 }}>
                            {error}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Zrusit</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
