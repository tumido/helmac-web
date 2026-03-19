"use client";

import { useState, useRef } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { Edit, Save, Close } from "@mui/icons-material";
import { updateEmailTemplate } from "@/lib/actions/years";
import { RichTextEditor, type Editor } from "@/components/admin/rich-text-editor";

type SaveAction = (yearId: string, formData: FormData) => Promise<{ success?: boolean; error?: string | Record<string, string[]> }>;

interface EmailAccountOption {
    id: string;
    email: string;
    label: string | null;
    isMain: boolean;
}

interface EmailTemplateEditorProps {
    yearId: string;
    confirmationEmailSubject: string | null;
    confirmationEmailBody: string | null;
    confirmationEmailBcc: string | null;
    availablePlaceholders: { key: string; label: string }[];
    saveAction?: SaveAction;
    emailAccounts?: EmailAccountOption[];
    selectedEmailAccountId?: string | null;
}

export function EmailTemplateEditor({
    yearId,
    confirmationEmailSubject: initialSubject,
    confirmationEmailBody: initialBody,
    confirmationEmailBcc: initialBcc,
    availablePlaceholders,
    saveAction = updateEmailTemplate,
    emailAccounts = [],
    selectedEmailAccountId: initialEmailAccountId,
}: EmailTemplateEditorProps) {
    const [editing, setEditing] = useState(false);
    const [savedSubject, setSavedSubject] = useState(initialSubject ?? "");
    const [savedBody, setSavedBody] = useState(initialBody ?? "");
    const [savedBcc, setSavedBcc] = useState(initialBcc ?? "");
    const [savedEmailAccountId, setSavedEmailAccountId] = useState(initialEmailAccountId ?? "");
    const [subject, setSubject] = useState(initialSubject ?? "");
    const [body, setBody] = useState(initialBody ?? "");
    const [bcc, setBcc] = useState(initialBcc ?? "");
    const [emailAccountId, setEmailAccountId] = useState(initialEmailAccountId ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);
    const editorRef = useRef<Editor | null>(null);

    // Convert plain text body (no HTML tags) to HTML for backward compatibility
    const toEditorHtml = (text: string) => {
        if (!text || text.includes("<")) return text;
        return text.replace(/\n/g, "<br>");
    };

    const insertPlaceholder = (placeholder: string) => {
        const editor = editorRef.current;
        if (!editor) {
            setBody((prev) => prev + `{${placeholder}}`);
            return;
        }
        editor.chain().focus().insertContent(`{${placeholder}}`).run();
    };

    const handleCancel = () => {
        setSubject(savedSubject);
        setBody(savedBody);
        setBcc(savedBcc);
        setEmailAccountId(savedEmailAccountId);
        setError(null);
        setFieldErrors({});
        setEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setFieldErrors({});
        setSuccess(false);

        const formData = new FormData();
        formData.set("confirmationEmailSubject", subject);
        formData.set("confirmationEmailBody", body);
        formData.set("confirmationEmailBcc", bcc);
        if (emailAccountId) {
            formData.set("emailAccountId", emailAccountId);
        }

        const result = await saveAction(yearId, formData);

        if (result && "error" in result && result.error) {
            if (typeof result.error === "string") {
                setError(result.error);
            } else {
                setFieldErrors(result.error as Record<string, string[]>);
            }
        } else {
            setSavedSubject(subject);
            setSavedBody(body);
            setSavedBcc(bcc);
            setSavedEmailAccountId(emailAccountId);
            setSuccess(true);
            setEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        }

        setSaving(false);
    };

    const hasTemplate = !!savedSubject || !!savedBody;

    return (
        <Box>
            <Card variant="outlined">
                <CardContent>
                    {!editing ? (
                        // Read-only mode
                        <Box>
                            {!hasTemplate ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Šablona emailu zatím není nastavena.
                                </Typography>
                            ) : (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Předmět
                                    </Typography>
                                    <Typography sx={{ mb: 2 }}>
                                        {savedSubject || "—"}
                                    </Typography>

                                    <Typography variant="subtitle2" color="text.secondary">
                                        Text emailu
                                    </Typography>
                                    {savedBody ? (
                                        <Box
                                            sx={{
                                                mb: 2,
                                                "& p": { margin: "0.5em 0" },
                                                "& a": { color: "primary.main", textDecoration: "underline" },
                                                "& ul, & ol": { paddingLeft: "1.5em" },
                                                "& blockquote": {
                                                    borderLeft: "4px solid",
                                                    borderColor: "grey.300",
                                                    paddingLeft: "1em",
                                                    marginLeft: 0,
                                                    fontStyle: "italic",
                                                    color: "text.secondary",
                                                },
                                            }}
                                            dangerouslySetInnerHTML={{ __html: savedBody }}
                                        />
                                    ) : (
                                        <Typography sx={{ mb: 2 }}>—</Typography>
                                    )}

                                    <Typography variant="subtitle2" color="text.secondary">
                                        BCC
                                    </Typography>
                                    <Typography sx={{ mb: 2 }}>
                                        {savedBcc || "—"}
                                    </Typography>

                                    {emailAccounts.length > 0 && (
                                        <>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Odesílatel
                                            </Typography>
                                            <Typography sx={{ mb: 2 }}>
                                                {(() => {
                                                    if (savedEmailAccountId) {
                                                        const acc = emailAccounts.find((a) => a.id === savedEmailAccountId);
                                                        if (acc) return `${acc.email}${acc.label ? ` – ${acc.label}` : ""}`;
                                                    }
                                                    const mainAcc = emailAccounts.find((a) => a.isMain);
                                                    return mainAcc ? `${mainAcc.email} (hlavní)` : "Hlavní účet";
                                                })()}
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            )}

                            {success && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Šablona emailu byla uložena
                                </Alert>
                            )}

                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => setEditing(true)}
                            >
                                Upravit
                            </Button>
                        </Box>
                    ) : (
                        // Edit mode
                        <Box>
                            {emailAccounts.length > 0 && (
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <InputLabel>Odesílat z</InputLabel>
                                    <Select
                                        value={emailAccountId}
                                        label="Odesílat z"
                                        onChange={(e) => setEmailAccountId(e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>Hlavní účet (výchozí)</em>
                                        </MenuItem>
                                        {emailAccounts.map((acc) => (
                                            <MenuItem key={acc.id} value={acc.id}>
                                                {acc.email}{acc.label ? ` – ${acc.label}` : ""}{acc.isMain ? " (hlavní)" : ""}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <TextField
                                label="Předmět emailu"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                fullWidth
                                size="small"
                                error={!!fieldErrors.confirmationEmailSubject}
                                helperText={fieldErrors.confirmationEmailSubject?.[0]}
                                sx={{ mb: 2 }}
                            />

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Text emailu
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                                <RichTextEditor
                                    value={toEditorHtml(body)}
                                    onChange={setBody}
                                    editorRef={editorRef}
                                    minHeight={200}
                                    placeholder="Zadejte text emailu..."
                                />
                                {fieldErrors.confirmationEmailBody && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                                        {fieldErrors.confirmationEmailBody[0]}
                                    </Typography>
                                )}
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                                Kliknutím na placeholder ho vložíte do textu:
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                                {availablePlaceholders.map((p) => (
                                    <Chip
                                        key={p.key}
                                        label={`${p.label} ({${p.key}})`}
                                        size="small"
                                        onClick={() => insertPlaceholder(p.key)}
                                        variant="outlined"
                                        sx={{ cursor: "pointer" }}
                                    />
                                ))}
                            </Box>

                            <TextField
                                label="BCC (kopie na admin email)"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                fullWidth
                                size="small"
                                error={!!fieldErrors.confirmationEmailBcc}
                                helperText={fieldErrors.confirmationEmailBcc?.[0] ?? "Volitelné - kopie každého potvrzovacího emailu"}
                                sx={{ mb: 2 }}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? "Ukládání..." : "Uložit"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Close />}
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Zrušit
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
