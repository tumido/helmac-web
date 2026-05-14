"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
    Alert,
    Box,
    CircularProgress,
    IconButton,
    Link,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Typography,
} from "@mui/material";
import { CloudUpload, Delete, AttachFile } from "@mui/icons-material";
import {
    ATTACHMENT_ALLOWED_TYPES,
    MAX_ATTACHMENT_SIZE,
    MAX_ATTACHMENTS_TOTAL,
    type EmailAttachment,
} from "@/lib/validators/email-attachment";

interface EmailAttachmentsListProps {
    value: EmailAttachment[];
    onChange: (next: EmailAttachment[]) => void;
    disabled?: boolean;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function EmailAttachmentsList({
    value,
    onChange,
    disabled = false,
}: EmailAttachmentsListProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalSize = value.reduce((sum, a) => sum + a.size, 0);
    const remaining = MAX_ATTACHMENTS_TOTAL - totalSize;

    const onDrop = useCallback(
        async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            setError(null);

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                setError(rejection.errors[0]?.message ?? "Soubor nelze nahrát");
                return;
            }

            if (acceptedFiles.length === 0) return;

            const incomingSize = acceptedFiles.reduce((sum, f) => sum + f.size, 0);
            if (totalSize + incomingSize > MAX_ATTACHMENTS_TOTAL) {
                setError(
                    `Celková velikost příloh by přesáhla ${formatBytes(MAX_ATTACHMENTS_TOTAL)}`,
                );
                return;
            }

            setUploading(true);
            const uploaded: EmailAttachment[] = [];
            try {
                for (const file of acceptedFiles) {
                    if (file.size > MAX_ATTACHMENT_SIZE) {
                        throw new Error(
                            `Soubor "${file.name}" je větší než ${formatBytes(MAX_ATTACHMENT_SIZE)}`,
                        );
                    }
                    const formData = new FormData();
                    formData.append("file", file);

                    const response = await fetch("/api/upload-attachment", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        const data = await response.json().catch(() => ({}));
                        throw new Error(data.error || "Nahrávání selhalo");
                    }

                    const data = await response.json();
                    uploaded.push({
                        filename: data.filename,
                        url: data.url,
                        contentType: data.contentType,
                        size: data.size,
                    });
                }
                onChange([...value, ...uploaded]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Nahrávání selhalo");
            } finally {
                setUploading(false);
            }
        },
        [onChange, totalSize, value],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ATTACHMENT_ALLOWED_TYPES.reduce(
            (acc, type) => ({ ...acc, [type]: [] }),
            {} as Record<string, string[]>,
        ),
        disabled: uploading || disabled || remaining <= 0,
    });

    const handleRemove = (url: string) => {
        onChange(value.filter((a) => a.url !== url));
    };

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Přílohy
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {value.length > 0 && (
                <List dense sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                    {value.map((a) => (
                        <ListItem key={a.url} divider>
                            <AttachFile fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                            <ListItemText
                                primary={
                                    <Link
                                        href={a.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                    >
                                        {a.filename}
                                    </Link>
                                }
                                secondary={formatBytes(a.size)}
                            />
                            {!disabled && (
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleRemove(a.url)}
                                        aria-label="Odebrat přílohu"
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            )}
                        </ListItem>
                    ))}
                </List>
            )}

            <Box
                {...getRootProps()}
                sx={{
                    border: "2px dashed",
                    borderColor: isDragActive ? "primary.main" : "grey.300",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                    cursor: uploading || disabled || remaining <= 0 ? "default" : "pointer",
                    bgcolor: isDragActive ? "action.hover" : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor:
                            uploading || disabled || remaining <= 0 ? "grey.300" : "primary.main",
                    },
                }}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" color="text.secondary">
                            Nahrávám…
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <CloudUpload sx={{ fontSize: 32, color: "grey.500" }} />
                        <Typography variant="body2" color="text.secondary">
                            {remaining <= 0
                                ? "Dosažen limit 25 MB"
                                : "Přetáhněte soubory nebo klikněte pro výběr"}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, obrázky · max {formatBytes(MAX_ATTACHMENT_SIZE)} / soubor · {formatBytes(totalSize)} / {formatBytes(MAX_ATTACHMENTS_TOTAL)}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
