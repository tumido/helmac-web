"use client";

import { useMemo, useState, useRef } from "react";
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
import { Edit, Save, Close, Send } from "@mui/icons-material";
import { updateEmailTemplate } from "@/lib/actions/years";
import { RichTextEditor, type Editor } from "@/components/admin/rich-text-editor";
import { richContentSx } from "@/lib/utils/rich-content-sx";
import { renderPlaceholderChipsInHtml } from "@/lib/utils/placeholder-html";
import { TestEmailDialog } from "@/components/admin/test-email-dialog";
import { ConditionalSectionsEditor } from "@/components/admin/email-builder/conditional-sections-editor";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import type { FormField, PricingDefinition } from "@/lib/types/registration-form";

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
    initialSections?: EmailConditionalSection[];
    availableFields?: FormField[];
    pricingDefinitions?: PricingDefinition[];
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
    initialSections = [],
    availableFields = [],
    pricingDefinitions = [],
}: EmailTemplateEditorProps) {
    const [editing, setEditing] = useState(false);
    const [savedSubject, setSavedSubject] = useState(initialSubject ?? "");
    const [savedBody, setSavedBody] = useState(initialBody ?? "");
    const [savedBcc, setSavedBcc] = useState(initialBcc ?? "");
    const [savedEmailAccountId, setSavedEmailAccountId] = useState(initialEmailAccountId ?? "");
    const [savedSections, setSavedSections] = useState<EmailConditionalSection[]>(initialSections);
    const [subject, setSubject] = useState(initialSubject ?? "");
    const [body, setBody] = useState(initialBody ?? "");
    const [bcc, setBcc] = useState(initialBcc ?? "");
    const [emailAccountId, setEmailAccountId] = useState(initialEmailAccountId ?? "");
    const [sections, setSections] = useState<EmailConditionalSection[]>(initialSections);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);
    const [testOpen, setTestOpen] = useState(false);
    const editorRef = useRef<Editor | null>(null);

    const displayBody = useMemo(
        () => renderPlaceholderChipsInHtml(savedBody, availablePlaceholders),
        [savedBody, availablePlaceholders],
    );

    const testSource = editing
        ? { subject, body, bcc, emailAccountId, sections }
        : {
              subject: savedSubject,
              body: savedBody,
              bcc: savedBcc,
              emailAccountId: savedEmailAccountId,
              sections: savedSections,
          };

    const usedPlaceholders = useMemo(() => {
        const sectionBodies = testSource.sections.map((s) => s.body).join("\n");
        const haystack = `${testSource.subject}\n${testSource.body}\n${sectionBodies}`;
        const keys = new Set<string>();
        for (const match of haystack.matchAll(/\{(\w+)\}/g)) {
            keys.add(match[1]);
        }
        for (const section of testSource.sections) {
            for (const rule of section.condition.rules) {
                const fieldId = rule.fieldId;
                if (!fieldId) continue;
                const field = availableFields.find((f) => f.id === fieldId);
                if (field && "name" in field && field.name) {
                    keys.add(field.name);
                }
            }
        }
        const labelByKey = new Map(
            availablePlaceholders.map((p) => [p.key, p.label]),
        );
        return Array.from(keys)
            .filter((k) => k !== "qrPlatba")
            .map((k) => ({ key: k, label: labelByKey.get(k) ?? k }));
    }, [testSource.subject, testSource.body, testSource.sections, availableFields, availablePlaceholders]);

    const canTest = !!testSource.subject || !!testSource.body;

    // Convert plain text body (no HTML tags) to HTML for backward compatibility
    const toEditorHtml = (text: string) => {
        if (!text || text.includes("<")) return text;
        return text.replace(/\n/g, "<br>");
    };

    const insertPlaceholder = (p: { key: string; label: string }) => {
        const editor = editorRef.current;
        if (!editor) {
            setBody((prev) => prev + `{${p.key}}`);
            return;
        }
        editor
            .chain()
            .focus()
            .insertContent({
                type: "placeholder",
                attrs: { key: p.key, label: p.label },
            })
            .run();
    };

    const handleCancel = () => {
        setSubject(savedSubject);
        setBody(savedBody);
        setBcc(savedBcc);
        setEmailAccountId(savedEmailAccountId);
        setSections(savedSections);
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
        formData.set("sectionsJson", JSON.stringify(sections));

        const result = await saveAction(yearId, formData);

        if (result && "error" in result && result.error) {
            if (typeof result.error === "string") {
                setError(result.error);
            } else {
                const errObj = result.error as Record<string, string[] | undefined>;
                if (errObj._form?.[0]) {
                    setError(errObj._form[0]);
                } else {
                    setFieldErrors(errObj as Record<string, string[]>);
                }
            }
        } else {
            setSavedSubject(subject);
            setSavedBody(body);
            setSavedBcc(bcc);
            setSavedEmailAccountId(emailAccountId);
            setSavedSections(sections);
            setSuccess(true);
            setEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        }

        setSaving(false);
    };

    const hasTemplate = !!savedSubject || !!savedBody;

    return (
        <Box
            sx={
                editing
                    ? {
                          height: "calc(100dvh - 180px)",
                          display: "flex",
                          flexDirection: "column",
                      }
                    : undefined
            }
        >
            <Card
                variant="outlined"
                sx={
                    editing
                        ? {
                              flex: 1,
                              minHeight: 0,
                              display: "flex",
                              flexDirection: "column",
                          }
                        : undefined
                }
            >
                <CardContent
                    sx={
                        editing
                            ? {
                                  flex: 1,
                                  minHeight: 0,
                                  display: "flex",
                                  flexDirection: "column",
                                  overflow: "auto",
                              }
                            : undefined
                    }
                >
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
                                                ...richContentSx,
                                            }}
                                            dangerouslySetInnerHTML={{ __html: displayBody }}
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

                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Edit />}
                                    onClick={() => setEditing(true)}
                                >
                                    Upravit
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Send />}
                                    onClick={() => setTestOpen(true)}
                                    disabled={!canTest}
                                >
                                    Testovací odeslání
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        // Edit mode
                        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, flexShrink: 0 }}>
                                Text emailu
                            </Typography>
                            <Box sx={{ mb: 1, flex: 1, minHeight: 200, display: "flex", flexDirection: "column" }}>
                                <RichTextEditor
                                    value={toEditorHtml(body)}
                                    onChange={setBody}
                                    format="html"
                                    editorRef={editorRef}
                                    minHeight={200}
                                    placeholder="Zadejte text emailu..."
                                    placeholders={availablePlaceholders}
                                />
                                {fieldErrors.confirmationEmailBody && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block", flexShrink: 0 }}>
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
                                        label={p.label}
                                        size="small"
                                        onClick={() => insertPlaceholder(p)}
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

                            <Box sx={{ mt: 1, mb: 2 }}>
                                <ConditionalSectionsEditor
                                    sections={sections}
                                    onChange={setSections}
                                    availableFields={availableFields}
                                    pricingDefinitions={pricingDefinitions}
                                    placeholders={availablePlaceholders}
                                />
                            </Box>

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
                                <Button
                                    variant="outlined"
                                    startIcon={<Send />}
                                    onClick={() => setTestOpen(true)}
                                    disabled={saving || !canTest}
                                >
                                    Testovací odeslání
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>
            <TestEmailDialog
                open={testOpen}
                onClose={() => setTestOpen(false)}
                subject={testSource.subject}
                body={testSource.body}
                bcc={testSource.bcc || null}
                emailAccountId={testSource.emailAccountId || null}
                usedPlaceholders={usedPlaceholders}
                sections={testSource.sections}
                availableFields={availableFields}
            />
        </Box>
    );
}
