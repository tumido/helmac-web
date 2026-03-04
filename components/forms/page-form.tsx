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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from "@mui/material";
import { Save, ExpandMore } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createPage, updatePage, PageActionState } from "@/lib/actions/pages";

interface PageFormProps {
    mode: "create" | "edit";
    yearId: string;
    pageId?: string;
    defaultValues?: {
        slug?: string;
        title?: string;
        seoTitle?: string | null;
        seoDesc?: string | null;
        sortOrder?: number;
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
                ? "Ukládám..."
                : mode === "create"
                  ? "Vytvořit stránku"
                  : "Uložit změny"}
        </Button>
    );
}

export function PageForm({ mode, yearId, pageId, defaultValues }: PageFormProps) {
    const action =
        mode === "create"
            ? createPage.bind(null, yearId)
            : updatePage.bind(null, pageId as string);

    const [state, formAction] = useActionState<PageActionState, FormData>(
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
                        <Alert severity="success">Změny byly uloženy.</Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required
                            fullWidth
                            id="title"
                            name="title"
                            label="Název stránky"
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
                                "Pouze malá písmena, čísla a pomlčky"
                            }
                            placeholder="např. o-akci"
                        />
                    </Box>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography>SEO nastavení</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                }}
                            >
                                <TextField
                                    fullWidth
                                    id="seoTitle"
                                    name="seoTitle"
                                    label="SEO titulek"
                                    defaultValue={defaultValues?.seoTitle || ""}
                                    error={!!state?.error?.seoTitle}
                                    helperText={
                                        state?.error?.seoTitle?.[0] ||
                                        "Max 70 znaků"
                                    }
                                    inputProps={{ maxLength: 70 }}
                                />

                                <TextField
                                    fullWidth
                                    id="seoDesc"
                                    name="seoDesc"
                                    label="SEO popis"
                                    defaultValue={defaultValues?.seoDesc || ""}
                                    error={!!state?.error?.seoDesc}
                                    helperText={
                                        state?.error?.seoDesc?.[0] ||
                                        "Max 160 znaků"
                                    }
                                    multiline
                                    rows={2}
                                    inputProps={{ maxLength: 160 }}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <input
                        type="hidden"
                        name="sortOrder"
                        value={defaultValues?.sortOrder ?? 0}
                    />
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={`/admin/rocniky/${yearId}`}>
                        Zrušit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
