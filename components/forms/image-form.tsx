"use client";

import { useState, useActionState } from "react";
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
    Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { addImage, updateImage, ImageActionState } from "@/lib/actions/albums";
import { ImageUploader } from "@/components/admin/image-uploader";

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
    cancelHref?: string;
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
                ? "Ukládám..."
                : mode === "create"
                  ? "Přidat obrázek"
                  : "Uložit změny"}
        </Button>
    );
}

export function ImageForm({ mode, albumId, imageId, defaultValues, cancelHref }: ImageFormProps) {
    const [imageUrl, setImageUrl] = useState(defaultValues?.url || "");

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
                                ? "Obrázek byl přidán."
                                : "Změny byly uloženy."}
                        </Alert>
                    )}

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Obrázek *
                        </Typography>
                        <ImageUploader
                            value={imageUrl}
                            onChange={setImageUrl}
                        />
                        <input type="hidden" name="url" value={imageUrl} />
                        {state?.error?.url && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {state.error.url[0]}
                            </Typography>
                        )}
                    </Box>

                    <TextField
                        fullWidth
                        id="thumbnailUrl"
                        name="thumbnailUrl"
                        label="URL náhledu (volitelné)"
                        defaultValue={defaultValues?.thumbnailUrl || ""}
                        error={!!state?.error?.thumbnailUrl}
                        helperText={
                            state?.error?.thumbnailUrl?.[0] ||
                            "Automaticky generováno, nebo vlastní URL"
                        }
                        placeholder="https://example.com/thumbnail.jpg"
                    />

                    <TextField
                        fullWidth
                        id="title"
                        name="title"
                        label="Název obrázku"
                        defaultValue={defaultValues?.title || ""}
                        error={!!state?.error?.title}
                        helperText={state?.error?.title?.[0]}
                    />

                    <TextField
                        fullWidth
                        id="altText"
                        name="altText"
                        label="Alt text (pro přístupnost)"
                        defaultValue={defaultValues?.altText || ""}
                        error={!!state?.error?.altText}
                        helperText={
                            state?.error?.altText?.[0] ||
                            "Popis obrázku pro čtečky obrazovky"
                        }
                    />

                    <TextField
                        fullWidth
                        id="description"
                        name="description"
                        label="Popis obrázku"
                        defaultValue={defaultValues?.description || ""}
                        error={!!state?.error?.description}
                        helperText={state?.error?.description?.[0]}
                        multiline
                        rows={3}
                    />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={cancelHref || `/admin/galerie/${albumId}`}>
                        Zpět na album
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
