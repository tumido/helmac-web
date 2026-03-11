"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    CloudUpload,
    CheckCircle,
    Error as ErrorIcon,
} from "@mui/icons-material";
import { addImages } from "@/lib/actions/albums";

interface AlbumImageDropzoneProps {
    albumId: string;
}

interface FileUpload {
    name: string;
    status: "uploading" | "done" | "failed";
    url?: string;
    error?: string;
}

const MAX_SIZE_MB = 15;
const ACCEPTED_TYPES: Record<string, string[]> = {
    "image/jpeg": [],
    "image/png": [],
    "image/webp": [],
    "image/gif": [],
};

export function AlbumImageDropzone({ albumId }: AlbumImageDropzoneProps) {
    const router = useRouter();
    const [uploads, setUploads] = useState<FileUpload[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isUploading = uploads.some((u) => u.status === "uploading") || saving;

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            setError(null);
            setSuccessMessage(null);

            const initialUploads: FileUpload[] = acceptedFiles.map((f) => ({
                name: f.name,
                status: "uploading" as const,
            }));
            setUploads(initialUploads);

            // Upload all files in parallel
            const results = await Promise.all(
                acceptedFiles.map(async (file, index) => {
                    try {
                        const formData = new FormData();
                        formData.append("file", file);

                        const response = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            throw new Error(data.error || "Nahrávání selhalo");
                        }

                        const data = await response.json();

                        if (!data.url) {
                            throw new Error("Server nevrátil URL obrázku");
                        }

                        setUploads((prev) =>
                            prev.map((u, i) =>
                                i === index
                                    ? { ...u, status: "done" as const, url: data.url }
                                    : u
                            )
                        );

                        return { url: data.url, error: null };
                    } catch (err) {
                        const message = err instanceof Error ? err.message : "Nahrávání selhalo";

                        setUploads((prev) =>
                            prev.map((u, i) =>
                                i === index
                                    ? { ...u, status: "failed" as const, error: message }
                                    : u
                            )
                        );

                        return { url: null, error: message };
                    }
                })
            );

            // Collect successful URLs
            const successfulUrls = results
                .filter((r): r is { url: string; error: null } => r.url !== null)
                .map((r) => r.url);

            if (successfulUrls.length > 0) {
                setSaving(true);
                const result = await addImages(albumId, successfulUrls);
                setSaving(false);

                if (result.error) {
                    setError(result.error);
                } else {
                    const failedCount = results.filter((r) => r.url === null).length;
                    if (failedCount > 0) {
                        setSuccessMessage(
                            `Přidáno ${successfulUrls.length} obrázků, ${failedCount} se nepodařilo nahrát.`
                        );
                    } else {
                        setSuccessMessage(
                            `Úspěšně přidáno ${successfulUrls.length} obrázků.`
                        );
                        // Clear uploads after full success
                        setTimeout(() => {
                            setUploads([]);
                            setSuccessMessage(null);
                        }, 2000);
                    }
                    router.refresh();
                }
            } else {
                setError("Žádný obrázek se nepodařilo nahrát.");
            }
        },
        [albumId, router]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ACCEPTED_TYPES,
        disabled: isUploading,
        maxSize: MAX_SIZE_MB * 1024 * 1024,
    });

    return (
        <Box sx={{ mb: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            <Box
                {...getRootProps()}
                sx={{
                    border: "2px dashed",
                    borderColor: isDragActive
                        ? "primary.main"
                        : "grey.300",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    cursor: isUploading ? "default" : "pointer",
                    bgcolor: isDragActive ? "action.hover" : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: isUploading ? "grey.300" : "primary.main",
                        bgcolor: isUploading ? "transparent" : "action.hover",
                    },
                }}
            >
                <input {...getInputProps()} />

                {isUploading ? (
                    <Box>
                        <CircularProgress size={32} sx={{ mb: 1 }} />
                        <Typography color="text.secondary" sx={{ mb: 1 }}>
                            {saving ? "Ukládám do databáze..." : "Nahrávám obrázky..."}
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                                alignItems: "center",
                            }}
                        >
                            {uploads.map((upload, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    {upload.status === "uploading" && (
                                        <CircularProgress size={14} />
                                    )}
                                    {upload.status === "done" && (
                                        <CheckCircle
                                            sx={{ fontSize: 16, color: "success.main" }}
                                        />
                                    )}
                                    {upload.status === "failed" && (
                                        <ErrorIcon
                                            sx={{ fontSize: 16, color: "error.main" }}
                                        />
                                    )}
                                    <Typography
                                        variant="caption"
                                        color={
                                            upload.status === "failed"
                                                ? "error"
                                                : "text.secondary"
                                        }
                                    >
                                        {upload.name}
                                        {upload.error ? ` - ${upload.error}` : ""}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <CloudUpload
                            sx={{
                                fontSize: 40,
                                color: isDragActive ? "primary.main" : "grey.400",
                            }}
                        />
                        <Typography color={isDragActive ? "primary" : "text.secondary"}>
                            {isDragActive
                                ? "Pusťte pro nahrání"
                                : "Přetáhněte obrázky nebo klikněte pro výběr"}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            JPG, PNG, WebP, GIF (max {MAX_SIZE_MB} MB)
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
