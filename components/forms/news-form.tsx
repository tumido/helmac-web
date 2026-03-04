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
    IconButton,
} from "@mui/material";
import { Save, Refresh } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createNews, updateNews, NewsActionState } from "@/lib/actions/news";
import { ImageUploader } from "@/components/admin/image-uploader";
import { generateSlug } from "@/lib/utils/slugify";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface NewsFormProps {
    mode: "create" | "edit";
    years: { id: string; year: number; title: string }[];
    newsId?: string;
    defaultValues?: {
        yearId?: string;
        slug?: string;
        title?: string;
        excerpt?: string | null;
        content?: string;
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
                  ? "Vytvorit novinku"
                  : "Ulozit zmeny"}
        </Button>
    );
}

export function NewsForm({ mode, years, newsId, defaultValues }: NewsFormProps) {
    const selectedYearId = defaultValues?.yearId || years[0]?.id || "";
    const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || "");
    const [content, setContent] = useState(defaultValues?.content || "");
    const [title, setTitle] = useState(defaultValues?.title || "");
    const [slug, setSlug] = useState(defaultValues?.slug || "");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");

    const action =
        mode === "create"
            ? async (prevState: NewsActionState, formData: FormData) => {
                  const yearId = formData.get("yearId") as string;
                  return createNews(yearId, prevState, formData);
              }
            : updateNews.bind(null, newsId as string);

    const [state, formAction] = useActionState<NewsActionState, FormData>(
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
                            label="Nazev novinky"
                            value={title}
                            onChange={(e) => {
                                const newTitle = e.target.value;
                                setTitle(newTitle);
                                if (!slugManuallyEdited) {
                                    setSlug(generateSlug(newTitle));
                                }
                            }}
                            error={!!state?.error?.title}
                            helperText={state?.error?.title?.[0]}
                        />

                        <TextField
                            required
                            fullWidth
                            id="slug"
                            name="slug"
                            label="URL slug"
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setSlugManuallyEdited(true);
                            }}
                            error={!!state?.error?.slug}
                            helperText={
                                state?.error?.slug?.[0] ||
                                "Pouze mala pismena, cisla a pomlcky"
                            }
                            placeholder="napr. nova-akce"
                            InputProps={{
                                endAdornment: slugManuallyEdited && mode === "create" ? (
                                    <IconButton
                                        size="small"
                                        title="Generovat z nazvu"
                                        onClick={() => {
                                            setSlug(generateSlug(title));
                                            setSlugManuallyEdited(false);
                                        }}
                                    >
                                        <Refresh fontSize="small" />
                                    </IconButton>
                                ) : undefined,
                            }}
                        />
                    </Box>

                    <TextField
                        fullWidth
                        id="excerpt"
                        name="excerpt"
                        label="Perex (kratky popis)"
                        defaultValue={defaultValues?.excerpt || ""}
                        error={!!state?.error?.excerpt}
                        helperText={
                            state?.error?.excerpt?.[0] || "Zobrazi se v prehledu novinek"
                        }
                        multiline
                        rows={2}
                        inputProps={{ maxLength: 500 }}
                    />

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Obsah *
                        </Typography>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            minHeight={300}
                        />
                        <input type="hidden" name="content" value={content} />
                        {state?.error?.content && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {state.error.content[0]}
                            </Typography>
                        )}
                    </Box>

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
                        label="Publikovat novinku"
                    />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href="/admin/novinky">
                        Zrusit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
