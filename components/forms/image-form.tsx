"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardActions,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import Link from "next/link";
import { addImage, updateImage, ImageActionState } from "@/lib/actions/albums";

interface ImageFormProps {
    mode: "create" | "edit";
    albumId: string;
    imageId?: string;
    defaultValues?: {
        url?: string;
        thumbnailUrl?: string | null;
        title?: string | null;
        description?: string | null;
        altText?: string | null;
    };
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={
                pending ? <CircularProgress size={20} color="inherit" /> : <Save />
            }
        >
            {pending
                ? "Ukladam..."
                : mode === "create"
                  ? "Pridat obrazek"
                  : "Ulozit zmeny"}
        </Button>
    );
}

export function ImageForm({ mode, albumId, imageId, defaultValues }: ImageFormProps) {
    const action =
        mode === "create"
            ? addImage.bind(null, albumId)
            : updateImage.bind(null, imageId as string);

    const [state, formAction] = useActionState<ImageActionState, FormData>(
        action,
        null
    );

    return (
        <Card>
            <Box component="form" action={formAction}>
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                    }}
                >
                    {state?.error?._form && (
                        <Alert severity="error">{state.error._form[0]}</Alert>
                    )}

                    {state?.success && (
                        <Alert severity="success">
                            {mode === "create"
                                ? "Obrazek byl pridan."
                                : "Zmeny byly ulozeny."}
                        </Alert>
                    )}

                    <TextField
                        required
                        fullWidth
                        id="url"
                        name="url"
                        label="URL obrazku"
                        defaultValue={defaultValues?.url || ""}
                        error={!!state?.error?.url}
                        helperText={state?.error?.url?.[0]}
                        placeholder="https://example.com/image.jpg"
                    />

                    <TextField
                        fullWidth
                        id="thumbnailUrl"
                        name="thumbnailUrl"
                        label="URL nahledu (volitelne)"
                        defaultValue={defaultValues?.thumbnailUrl || ""}
                        error={!!state?.error?.thumbnailUrl}
                        helperText={
                            state?.error?.thumbnailUrl?.[0] ||
                            "Mensi verze obrazku pro rychlejsi nacitani"
                        }
                        placeholder="https://example.com/thumbnail.jpg"
                    />

                    <TextField
                        fullWidth
                        id="title"
                        name="title"
                        label="Nazev obrazku"
                        defaultValue={defaultValues?.title || ""}
                        error={!!state?.error?.title}
                        helperText={state?.error?.title?.[0]}
                    />

                    <TextField
                        fullWidth
                        id="altText"
                        name="altText"
                        label="Alt text (pro pristupnost)"
                        defaultValue={defaultValues?.altText || ""}
                        error={!!state?.error?.altText}
                        helperText={
                            state?.error?.altText?.[0] ||
                            "Popis obrazku pro ctenky obrazovky"
                        }
                    />

                    <TextField
                        fullWidth
                        id="description"
                        name="description"
                        label="Popis obrazku"
                        defaultValue={defaultValues?.description || ""}
                        error={!!state?.error?.description}
                        helperText={state?.error?.description?.[0]}
                        multiline
                        rows={3}
                    />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <Button component={Link} href={`/admin/galerie/${albumId}`}>
                        Zpet na album
                    </Button>
                </CardActions>
            </Box>
        </Card>
    );
}
