"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { Preview, Save } from "@mui/icons-material";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
    createCampaign,
    previewRecipients,
    updateCampaign,
} from "@/lib/actions/email-campaigns";
import type { RecipientFilter } from "@/lib/validators/email-campaign";
import { REGISTRATION_STATUS_OPTIONS } from "./campaign-status";

interface EmailAccountOption {
    id: string;
    email: string;
    label: string | null;
    isMain: boolean;
}

interface CampaignFormProps {
    yearId: string;
    emailAccounts: EmailAccountOption[];
    availablePlaceholders: { key: string; label: string }[];
    campaign?: {
        id: string;
        name: string;
        subject: string;
        body: string;
        bcc: string | null;
        accountId: string | null;
        recipientFilter: RecipientFilter;
    };
}

const ALL_STATUSES = REGISTRATION_STATUS_OPTIONS.map((s) => s.value);

export function CampaignForm({
    yearId,
    emailAccounts,
    availablePlaceholders,
    campaign,
}: CampaignFormProps) {
    const router = useRouter();
    const [name, setName] = useState(campaign?.name ?? "");
    const [subject, setSubject] = useState(campaign?.subject ?? "");
    const [body, setBody] = useState(campaign?.body ?? "");
    const [bcc, setBcc] = useState(campaign?.bcc ?? "");
    const [accountId, setAccountId] = useState(campaign?.accountId ?? "");
    const [statuses, setStatuses] = useState<string[]>(
        campaign?.recipientFilter.statuses ?? ALL_STATUSES,
    );
    const [paid, setPaid] = useState<"all" | "paid" | "unpaid">(
        campaign?.recipientFilter.paid ?? "all",
    );
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<{
        count: number;
        sample: string[];
    } | null>(null);
    const [isSaving, startSaving] = useTransition();
    const [isPreviewing, startPreviewing] = useTransition();

    const filter: RecipientFilter = {
        statuses: statuses as RecipientFilter["statuses"],
        paid,
    };

    const handlePreview = () => {
        setError(null);
        startPreviewing(async () => {
            const result = await previewRecipients(yearId, filter);
            if (result.error) {
                setError(result.error);
                setPreview(null);
                return;
            }
            setPreview({
                count: result.count ?? 0,
                sample: result.sample ?? [],
            });
        });
    };

    const handleSave = () => {
        setError(null);
        startSaving(async () => {
            const input = {
                name: name.trim(),
                subject: subject.trim(),
                body,
                bcc: bcc.trim() || null,
                accountId: accountId || null,
                recipientFilter: filter,
            };

            const result = campaign
                ? await updateCampaign(campaign.id, input)
                : await createCampaign(yearId, input);

            if (result.error) {
                setError(result.error);
                return;
            }

            if (!campaign && "id" in result && result.id) {
                router.push(
                    `/admin/rocniky/${yearId}/emaily/hromadne/${result.id}`,
                );
            }
            router.refresh();
        });
    };

    return (
        <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <TextField
                        label="Název kampaně"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        placeholder="např. Informace před akcí"
                        disabled={isSaving}
                    />

                    <Typography variant="h6">Příjemci</Typography>

                    <FormControl fullWidth disabled={isSaving}>
                        <InputLabel>Stavy registrací</InputLabel>
                        <Select
                            multiple
                            value={statuses}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStatuses(
                                    typeof value === "string"
                                        ? value.split(",")
                                        : value,
                                );
                                setPreview(null);
                            }}
                            label="Stavy registrací"
                            renderValue={(selected) =>
                                selected
                                    .map(
                                        (v) =>
                                            REGISTRATION_STATUS_OPTIONS.find(
                                                (o) => o.value === v,
                                            )?.label ?? v,
                                    )
                                    .join(", ")
                            }
                        >
                            {REGISTRATION_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Checkbox
                                        checked={statuses.includes(option.value)}
                                    />
                                    <ListItemText primary={option.label} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={isSaving}>
                        <InputLabel>Platba</InputLabel>
                        <Select
                            value={paid}
                            onChange={(e) => {
                                setPaid(
                                    e.target.value as "all" | "paid" | "unpaid",
                                );
                                setPreview(null);
                            }}
                            label="Platba"
                        >
                            <MenuItem value="all">Všichni</MenuItem>
                            <MenuItem value="paid">Pouze zaplacené</MenuItem>
                            <MenuItem value="unpaid">Pouze nezaplacené</MenuItem>
                        </Select>
                    </FormControl>

                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={
                                isPreviewing ? (
                                    <CircularProgress size={18} />
                                ) : (
                                    <Preview />
                                )
                            }
                            onClick={handlePreview}
                            disabled={isPreviewing || statuses.length === 0}
                        >
                            Náhled příjemců
                        </Button>
                        {preview && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Počet příjemců: <strong>{preview.count}</strong>
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                    }}
                                >
                                    {preview.sample.map((email) => (
                                        <Chip
                                            key={email}
                                            size="small"
                                            label={email}
                                        />
                                    ))}
                                    {preview.count > preview.sample.length && (
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={`+ ${preview.count - preview.sample.length} dalších`}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <Typography variant="h6">Obsah emailu</Typography>

                    <FormControl fullWidth disabled={isSaving}>
                        <InputLabel>Odesílatel</InputLabel>
                        <Select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            label="Odesílatel"
                            displayEmpty
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
                        disabled={isSaving}
                    />

                    <TextField
                        label="Skrytá kopie (BCC)"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        fullWidth
                        disabled={isSaving}
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
                            placeholders={availablePlaceholders}
                        />
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}

                    <Box>
                        <Button
                            variant="contained"
                            startIcon={
                                isSaving ? (
                                    <CircularProgress size={18} />
                                ) : (
                                    <Save />
                                )
                            }
                            onClick={handleSave}
                            disabled={
                                isSaving ||
                                !name.trim() ||
                                !subject.trim() ||
                                !body.trim() ||
                                statuses.length === 0
                            }
                        >
                            {campaign ? "Uložit změny" : "Vytvořit koncept"}
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}
