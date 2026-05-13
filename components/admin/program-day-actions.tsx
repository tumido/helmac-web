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
import { useToast } from "@/lib/hooks/use-toast";
import { builderPalette as p } from "@/components/admin/email-builder/palette";

interface ProgramDayActionsProps {
    dayId: string;
    eventsCount: number;
}

export function ProgramDayActions({
    dayId,
    eventsCount,
}: ProgramDayActionsProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] =
        useState(false);

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteProgramDay(dayId);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Den programu byl smazán");
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
            <Tooltip title="Smazat den">
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
                <DialogTitle>
                    Smazat den programu?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tento den
                        programu?
                        {eventsCount > 0 && (
                            <>
                                {" "}
                                <strong>
                                    Bude smazano take{" "}
                                    {eventsCount}{" "}
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
                        Tato akce je nevratná.
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
