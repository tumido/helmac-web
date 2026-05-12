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
    MenuItem,
    Typography,
    IconButton,
    Switch,
    FormControlLabel,
} from "@mui/material";
import { Save, Refresh } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createNews, updateNews, NewsActionState } from "@/lib/actions/news";
import { ImageUploader } from "@/components/admin/image-uploader";
import { generateSlug } from "@/lib/utils/slugify";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { TocPreview } from "@/components/admin/toc-preview";

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
        showToc?: boolean;
    };
    cancelHref?: string;
    redirectTo?: string;
    hideYearSelect?: boolean;
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
                  ? "Vytvořit novinku"
                  : "Uložit změny"}
        </Button>
    );
}

export function NewsForm({ mode, years, newsId, defaultValues, cancelHref = "/admin/novinky", redirectTo, hideYearSelect }: NewsFormProps) {
    const selectedYearId = defaultValues?.yearId || years[0]?.id || "";
    const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || "");
    const [content, setContent] = useState(defaultValues?.content || "");
    const [title, setTitle] = useState(defaultValues?.title || "");
    const [slug, setSlug] = useState(defaultValues?.slug || "");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
    const [showToc, setShowToc] = useState(defaultValues?.showToc || false);

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
        <Card
            sx={{
                height: "calc(100dvh - 180px)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box
                component="form"
                action={formAction}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        flex: 1,
                        overflow: "auto",
                        minHeight: 0,
                    }}
                >
                    {state?.error?._form && (
                        <Alert severity="error">{state.error._form[0]}</Alert>
                    )}

                    {redirectTo && (
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                    )}

                    {mode === "create" && hideYearSelect && (
                        <input type="hidden" name="yearId" value={selectedYearId} />
                    )}

                    {mode === "create" && !hideYearSelect && (
                        <TextField
                            select
                            required
                            fullWidth
                            id="yearId"
                            name="yearId"
                            label="Ročník"
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
                            label="Název novinky"
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
                                "Pouze malá písmena, čísla a pomlčky"
                            }
                            placeholder="např. nová-akce"
                            InputProps={{
                                endAdornment: slugManuallyEdited && mode === "create" ? (
                                    <IconButton
                                        size="small"
                                        title="Generovat z názvu"
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
                        label="Perex (krátký popis)"
                        defaultValue={defaultValues?.excerpt || ""}
                        error={!!state?.error?.excerpt}
                        helperText={
                            state?.error?.excerpt?.[0] || "Zobrazí se v přehledu novinek"
                        }
                        multiline
                        rows={2}
                        inputProps={{ maxLength: 500 }}
                    />

                    <TocPreview show={showToc} content={content}>
                        <Box
                            sx={{
                                flex: 1,
                                minHeight: 200,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1, flexShrink: 0 }}
                            >
                                Obsah *
                            </Typography>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                minHeight={200}
                                yearId={selectedYearId}
                            />
                            <input type="hidden" name="content" value={content} />
                            {state?.error?.content && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ mt: 0.5, flexShrink: 0 }}
                                >
                                    {state.error.content[0]}
                                </Typography>
                            )}
                        </Box>
                    </TocPreview>

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Titulní obrázek (volitelné)
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
                                name="showToc"
                                value="true"
                                checked={showToc}
                                onChange={(e) => setShowToc(e.target.checked)}
                            />
                        }
                        label="Zobrazit obsah"
                    />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={cancelHref}>
                        Zrušit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
