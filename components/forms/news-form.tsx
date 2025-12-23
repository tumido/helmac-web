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
    FormControlLabel,
    Switch,
    MenuItem,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import Link from "next/link";
import { createNews, updateNews, NewsActionState } from "@/lib/actions/news";

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
                            placeholder="napr. nova-akce"
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

                    <TextField
                        required
                        fullWidth
                        id="content"
                        name="content"
                        label="Obsah"
                        defaultValue={defaultValues?.content || ""}
                        error={!!state?.error?.content}
                        helperText={state?.error?.content?.[0]}
                        multiline
                        rows={10}
                    />

                    <TextField
                        fullWidth
                        id="coverImage"
                        name="coverImage"
                        label="URL titulniho obrazku"
                        defaultValue={defaultValues?.coverImage || ""}
                        error={!!state?.error?.coverImage}
                        helperText={state?.error?.coverImage?.[0]}
                        placeholder="https://example.com/image.jpg"
                    />

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
                    <Button component={Link} href="/admin/novinky">
                        Zrusit
                    </Button>
                </CardActions>
            </Box>
        </Card>
    );
}
