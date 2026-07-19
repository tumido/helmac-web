"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import {
    Delete,
    Pause,
    PlayArrow,
    Replay,
    Send,
} from "@mui/icons-material";
import {
    deleteCampaign,
    pauseCampaign,
    previewRecipients,
    resumeCampaign,
    retryFailedItems,
    startCampaign,
} from "@/lib/actions/email-campaigns";
import type { RecipientFilter } from "@/lib/validators/email-campaign";

interface CampaignDetailActionsProps {
    campaignId: string;
    yearId: string;
    status: string;
    stalled: boolean;
    failedCount: number;
    recipientFilter?: RecipientFilter;
}

export function CampaignDetailActions({
    campaignId,
    yearId,
    status,
    stalled,
    failedCount,
    recipientFilter,
}: CampaignDetailActionsProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    // Live progress while the queue is draining
    useEffect(() => {
        if (status !== "SENDING") return;
        const interval = setInterval(() => router.refresh(), 10_000);
        return () => clearInterval(interval);
    }, [status, router]);

    const run = (action: () => Promise<{ error?: string }>) => {
        setError(null);
        startTransition(async () => {
            const result = await action();
            if (result.error) {
                setError(result.error);
                return;
            }
            router.refresh();
        });
    };

    const handleOpenConfirm = () => {
        setConfirmOpen(true);
        setRecipientCount(null);
        if (!recipientFilter) return;
        startTransition(async () => {
            const result = await previewRecipients(yearId, recipientFilter);
            if (result.count !== undefined) {
                setRecipientCount(result.count);
            }
        });
    };

    const handleStart = () => {
        setConfirmOpen(false);
        run(() => startCampaign(campaignId));
    };

    const handleDelete = () => {
        setDeleteOpen(false);
        setError(null);
        startTransition(async () => {
            const result = await deleteCampaign(campaignId);
            if (result.error) {
                setError(result.error);
                return;
            }
            router.push(`/admin/rocniky/${yearId}/emaily/hromadne`);
            router.refresh();
        });
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {status === "DRAFT" && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={
                            isPending ? (
                                <CircularProgress size={18} />
                            ) : (
                                <Send />
                            )
                        }
                        onClick={handleOpenConfirm}
                        disabled={isPending}
                    >
                        Odeslat kampaň
                    </Button>
                )}

                {status === "SENDING" && (
                    <Button
                        variant="outlined"
                        startIcon={<Pause />}
                        onClick={() => run(() => pauseCampaign(campaignId))}
                        disabled={isPending}
                    >
                        Pozastavit
                    </Button>
                )}

                {(status === "PAUSED" || stalled) && (
                    <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => run(() => resumeCampaign(campaignId))}
                        disabled={isPending}
                    >
                        Pokračovat
                    </Button>
                )}

                {failedCount > 0 && status !== "SENDING" && (
                    <Button
                        variant="outlined"
                        startIcon={<Replay />}
                        onClick={() => run(() => retryFailedItems(campaignId))}
                        disabled={isPending}
                    >
                        Opakovat neúspěšné ({failedCount})
                    </Button>
                )}

                {status !== "SENDING" && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteOpen(true)}
                        disabled={isPending}
                    >
                        Smazat
                    </Button>
                )}
            </Box>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Odeslat kampaň?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Kampaň se začne odesílat všem příjemcům odpovídajícím
                        uloženému filtru. Odesílání je rozloženo v čase kvůli
                        limitům poskytovatele a může trvat i několik hodin.
                        {recipientCount !== null &&
                            ` Počet příjemců: ${recipientCount}.`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>
                        Zrušit
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleStart}
                        disabled={isPending}
                    >
                        Odeslat
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Smazat kampaň?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Kampaň a její fronta emailů budou trvale odstraněny.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Zrušit</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
