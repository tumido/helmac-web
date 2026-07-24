"use client";

import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { ForwardToInbox, Send } from "@mui/icons-material";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { RecipientFilter } from "@/lib/validators/email-campaign";
import { TestEmailDialog } from "@/components/admin/test-email-dialog";
import { MassEmailSendConfirmDialog } from "./mass-email-send-confirm-dialog";

interface EmailAccountOption {
    id: string;
    email: string;
    label: string | null;
    isMain: boolean;
}

interface MassEmailComposerProps {
    yearId: string;
    emailAccounts: EmailAccountOption[];
    availablePlaceholders: { key: string; label: string }[];
}

type RecipientGroup = "all" | "paid" | "unpaid";

const GROUP_OPTIONS: { value: RecipientGroup; label: string }[] = [
    { value: "all", label: "Všichni registrovaní" },
    { value: "paid", label: "Zaplacení" },
    { value: "unpaid", label: "Nezaplacení" },
];

export function MassEmailComposer({
    yearId,
    emailAccounts,
    availablePlaceholders,
}: MassEmailComposerProps) {
    const [group, setGroup] = useState<RecipientGroup>("all");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [accountId, setAccountId] = useState("");
    const [testOpen, setTestOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const canSend = subject.trim().length > 0 && body.trim().length > 0;

    // Placeholders actually referenced in the subject/body, so the test dialog
    // can offer a sample-value field for each one.
    const usedPlaceholders = useMemo(() => {
        const haystack = `${subject}\n${body}`;
        const keys = new Set<string>();
        for (const match of haystack.matchAll(/\{(\w+)\}/g)) {
            keys.add(match[1]);
        }
        const labelByKey = new Map(
            availablePlaceholders.map((ph) => [ph.key, ph.label]),
        );
        return Array.from(keys).map((k) => ({
            key: k,
            label: labelByKey.get(k) ?? k,
        }));
    }, [subject, body, availablePlaceholders]);

    const filter: RecipientFilter = {
        statuses: ["PENDING", "CONFIRMED", "WAITLIST"],
        paid: group,
    };
    const groupLabel =
        GROUP_OPTIONS.find((o) => o.value === group)?.label ?? "";

    return (
        <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            flexWrap: "wrap",
                        }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<ForwardToInbox />}
                            onClick={() => setTestOpen(true)}
                            disabled={!canSend}
                        >
                            Testovací odeslání
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Send />}
                            onClick={() => setConfirmOpen(true)}
                            disabled={!canSend}
                        >
                            Odeslat
                        </Button>
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel>Komu odeslat</InputLabel>
                        <Select
                            value={group}
                            onChange={(e) =>
                                setGroup(e.target.value as RecipientGroup)
                            }
                            label="Komu odeslat"
                        >
                            {GROUP_OPTIONS.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel shrink>Odesílatel</InputLabel>
                        <Select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            label="Odesílatel"
                            displayEmpty
                            notched
                        >
                            <MenuItem value="">Hlavní emailový účet</MenuItem>
                            {emailAccounts.map((account) => (
                                <MenuItem key={account.id} value={account.id}>
                                    {account.email}
                                    {account.label ? ` (${account.label})` : ""}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Předmět"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        fullWidth
                    />

                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Text emailu
                        </Typography>
                        <RichTextEditor
                            value={body}
                            onChange={setBody}
                            format="html"
                            minHeight={300}
                            yearId={yearId}
                        />
                    </Box>
                </Box>
            </CardContent>

            <TestEmailDialog
                open={testOpen}
                onClose={() => setTestOpen(false)}
                subject={subject}
                body={body}
                bcc={null}
                emailAccountId={accountId || null}
                usedPlaceholders={usedPlaceholders}
            />
            <MassEmailSendConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                yearId={yearId}
                filter={filter}
                groupLabel={groupLabel}
                subject={subject.trim()}
                body={body}
                accountId={accountId || null}
            />
        </Card>
    );
}
