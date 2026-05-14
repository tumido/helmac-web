"use client";

import { useRef } from "react";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { RichTextEditor, type Editor } from "@/components/admin/rich-text-editor";
import { EmailAttachmentsList } from "@/components/admin/email-attachments-list";
import { PanelLabel } from "./panel-label";
import { PlaceholderStrip } from "./placeholder-strip";
import { builderPalette as p } from "./palette";
import type { EmailAttachment } from "@/lib/validators/email-attachment";

interface EmailAccountOption {
    id: string;
    email: string;
    label: string | null;
    isMain: boolean;
}

interface SectionPaneBaseProps {
    subject: string;
    body: string;
    bcc: string;
    emailAccountId: string;
    emailAccounts: EmailAccountOption[];
    placeholders: { key: string; label: string }[];
    fieldErrors: Record<string, string[]>;
    attachments: EmailAttachment[];
    onSubjectChange: (v: string) => void;
    onBodyChange: (v: string) => void;
    onBccChange: (v: string) => void;
    onEmailAccountIdChange: (v: string) => void;
    onAttachmentsChange: (v: EmailAttachment[]) => void;
}

const toEditorHtml = (text: string) => {
    if (!text || text.includes("<")) return text;
    return text.replace(/\n/g, "<br>");
};

export function SectionPaneBase({
    subject,
    body,
    bcc,
    emailAccountId,
    emailAccounts,
    placeholders,
    fieldErrors,
    attachments,
    onSubjectChange,
    onBodyChange,
    onBccChange,
    onEmailAccountIdChange,
    onAttachmentsChange,
}: SectionPaneBaseProps) {
    const editorRef = useRef<Editor | null>(null);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <PanelLabel>Předmět</PanelLabel>
                <TextField
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Předmět emailu"
                    error={!!fieldErrors.confirmationEmailSubject}
                    helperText={fieldErrors.confirmationEmailSubject?.[0]}
                />
            </Box>

            <Box>
                <PanelLabel>Text emailu</PanelLabel>
                <RichTextEditor
                    value={toEditorHtml(body)}
                    onChange={onBodyChange}
                    format="html"
                    editorRef={editorRef}
                    minHeight={200}
                    placeholder="Zadejte text emailu..."
                    placeholders={placeholders}
                />
                {fieldErrors.confirmationEmailBody && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                        {fieldErrors.confirmationEmailBody[0]}
                    </Typography>
                )}
                <PlaceholderStrip
                    placeholders={placeholders}
                    editorRef={editorRef}
                    onFallbackInsert={(key) => onBodyChange(body + `{${key}}`)}
                />
            </Box>

            <Box>
                <PanelLabel>BCC</PanelLabel>
                <TextField
                    value={bcc}
                    onChange={(e) => onBccChange(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Volitelná kopie na admin email"
                    error={!!fieldErrors.confirmationEmailBcc}
                    helperText={fieldErrors.confirmationEmailBcc?.[0] ?? "Volitelné — kopie každého odeslaného emailu"}
                />
            </Box>

            {emailAccounts.length > 0 && (
                <Box>
                    <PanelLabel>Odesílatel</PanelLabel>
                    <FormControl fullWidth size="small">
                        <InputLabel>Odesílat z</InputLabel>
                        <Select
                            value={emailAccountId}
                            label="Odesílat z"
                            onChange={(e) => onEmailAccountIdChange(e.target.value)}
                            sx={{ backgroundColor: p.surface }}
                        >
                            <MenuItem value="">
                                <em>Hlavní účet (výchozí)</em>
                            </MenuItem>
                            {emailAccounts.map((acc) => (
                                <MenuItem key={acc.id} value={acc.id}>
                                    {acc.email}
                                    {acc.label ? ` – ${acc.label}` : ""}
                                    {acc.isMain ? " (hlavní)" : ""}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            <Box>
                <EmailAttachmentsList
                    value={attachments}
                    onChange={onAttachmentsChange}
                />
            </Box>
        </Box>
    );
}
