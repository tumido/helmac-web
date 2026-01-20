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
    FormControlLabel,
    Switch,
    MenuItem,
    Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createAlbum, updateAlbum, AlbumActionState } from "@/lib/actions/albums";
import { ImageUploader } from "@/components/admin/image-uploader";

interface AlbumFormProps {
    mode: "create" | "edit";
    years: { id: string; year: number; title: string }[];
    albumId?: string;
    defaultValues?: {
        yearId?: string;
        slug?: string;
        title?: string;
        description?: string | null;
        coverImage?: string | null;
        isPublished?: boolean;
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
                  ? "Vytvorit album"
                  : "Ulozit zmeny"}
        </Button>
    );
}

export function AlbumForm({ mode, years, albumId, defaultValues }: AlbumFormProps) {
    const selectedYearId = defaultValues?.yearId || years[0]?.id || "";
    const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || "");

    const action =
        mode === "create"
            ? async (prevState: AlbumActionState, formData: FormData) => {
                  const yearId = formData.get("yearId") as string;
                  return createAlbum(yearId, prevState, formData);
              }
            : updateAlbum.bind(null, albumId as string);

    const [state, formAction] = useActionState<AlbumActionState, FormData>(
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
                        <Alert severity="success">Zmeny byly ulozeny.</Alert>
                    )}

                    {mode === "create" && (
                        <TextField
                            select
                            required
                            fullWidth
                            id="yearId"
                            name="yearId"
                            label="Rocnik"
                            defaultValue={selectedYearId}
                        >
                            {years.map((year) => (
                                <MenuItem key={year.id} value={year.id}>
                                    {year.year} - {year.title}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "2fr 1fr",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required
                            fullWidth
                            id="title"
                            name="title"
                            label="Nazev alba"
                            defaultValue={defaultValues?.title || ""}
                            error={!!state?.error?.title}
                            helperText={state?.error?.title?.[0]}
                        />

                        <TextField
                            required
                            fullWidth
                            id="slug"
                            name="slug"
                            label="URL slug"
                            defaultValue={defaultValues?.slug || ""}
                            error={!!state?.error?.slug}
                            helperText={
                                state?.error?.slug?.[0] ||
                                "Pouze mala pismena, cisla a pomlcky"
                            }
                            placeholder="napr. fotky-z-akce"
                        />
                    </Box>

                    <TextField
                        fullWidth
                        id="description"
                        name="description"
                        label="Popis alba"
                        defaultValue={defaultValues?.description || ""}
                        error={!!state?.error?.description}
                        helperText={state?.error?.description?.[0]}
                        multiline
                        rows={3}
                        inputProps={{ maxLength: 1000 }}
                    />

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Titulni obrazek (volitelne)
                        </Typography>
                        <ImageUploader
                            value={coverImage}
                            onChange={setCoverImage}
                        />
                        <input type="hidden" name="coverImage" value={coverImage} />
                        {state?.error?.coverImage && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {state.error.coverImage[0]}
                            </Typography>
                        )}
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                id="isPublished"
                                name="isPublished"
                                value="true"
                                defaultChecked={defaultValues?.isPublished ?? false}
                            />
                        }
                        label="Publikovat album"
                    />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href="/admin/galerie">
                        Zrusit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
