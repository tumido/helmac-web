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
    DialogTitle,
    Typography,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import {
    createCampaign,
    previewRecipients,
    startCampaign,
} from "@/lib/actions/email-campaigns";
import type { RecipientFilter } from "@/lib/validators/email-campaign";

interface MassEmailSendConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    yearId: string;
    filter: RecipientFilter;
    groupLabel: string;
    subject: string;
    body: string;
    accountId: string | null;
}

export function MassEmailSendConfirmDialog({
    open,
    onClose,
    yearId,
    filter,
    groupLabel,
    subject,
    body,
    accountId,
}: MassEmailSendConfirmDialogProps) {
    const router = useRouter();
    const [count, setCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSending, startSending] = useTransition();

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setCount(null);
        setError(null);
        previewRecipients(yearId, filter).then((result) => {
            if (cancelled) return;
            if (result.error) {
                setError(result.error);
                return;
            }
            setCount(result.count ?? 0);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleClose = () => {
        if (!isSending) {
            onClose();
        }
    };

    const handleSend = () => {
        setError(null);
        startSending(async () => {
            const created = await createCampaign(yearId, {
                name: subject.slice(0, 200),
                subject,
                body,
                bcc: null,
                accountId: accountId || null,
                recipientFilter: filter,
            });
            if (created.error || !created.id) {
                setError(created.error ?? "Nepodařilo se odeslat");
                return;
            }

            const started = await startCampaign(created.id);
            if (started.error) {
                // The record exists as a draft — send it from its detail page
                setError(started.error);
            }
            router.push(
                `/admin/rocniky/${yearId}/emaily/hromadne/${created.id}`,
            );
            router.refresh();
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Odeslat hromadný email?</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        mt: 1,
                    }}
                >
                    {count === null && !error ? (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="text.secondary">
                                Načítání příjemců...
                            </Typography>
                        </Box>
                    ) : count !== null ? (
                        <Typography>
                            Bude odesláno <strong>{count}</strong> příjemcům
                            (skupina: {groupLabel}). Odesílání probíhá na pozadí
                            a kvůli limitům poskytovatele může trvat déle.
                        </Typography>
                    ) : null}

                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                        >
                            Předmět
                        </Typography>
                        <Typography sx={{ fontWeight: 500 }}>
                            {subject}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                        >
                            Text emailu
                        </Typography>
                        <Box
                            sx={{
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                p: 2,
                                maxHeight: 300,
                                overflowY: "auto",
                            }}
                            dangerouslySetInnerHTML={{ __html: body }}
                        />
                    </Box>

                    {count === 0 && (
                        <Alert severity="warning">
                            Vybrané skupině neodpovídají žádní příjemci.
                        </Alert>
                    )}
                    {error && <Alert severity="error">{error}</Alert>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isSending}>
                    Zrušit
                </Button>
                <Button
                    variant="contained"
                    startIcon={
                        isSending ? <CircularProgress size={18} /> : <Send />
                    }
                    onClick={handleSend}
                    disabled={isSending || !count}
                >
                    {isSending
                        ? "Odesílání..."
                        : count
                          ? `Odeslat (${count})`
                          : "Odeslat"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
