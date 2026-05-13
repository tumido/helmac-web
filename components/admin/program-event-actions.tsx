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
import { deleteProgramEvent } from "@/lib/actions/program-events";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import { builderPalette as p } from "@/components/admin/email-builder/palette";

interface ProgramEventActionsProps {
    eventId: string;
}

export function ProgramEventActions({
    eventId,
}: ProgramEventActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] =
        useState(false);

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteProgramEvent(eventId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Událost byla smazána");
            router.refresh();
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                }}
            >
                <CircularProgress size={16} />
            </Box>
        );
    }

    return (
        <>
            <Tooltip title="Smazat událost">
                <IconButton
                    size="small"
                    onClick={() =>
                        setDeleteDialogOpen(true)
                    }
                    sx={{
                        color: p.ink3,
                        "&:hover": { color: p.negInk },
                    }}
                >
                    <Delete sx={{ fontSize: 16 }} />
                </IconButton>
            </Tooltip>

            <Dialog
                open={deleteDialogOpen}
                onClose={() =>
                    setDeleteDialogOpen(false)
                }
            >
                <DialogTitle>Smazat událost?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tuto
                        událost? Tato akce je nevratná.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() =>
                            setDeleteDialogOpen(false)
                        }
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
