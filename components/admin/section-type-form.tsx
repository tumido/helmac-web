"use client";

import { useState, useActionState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import {
    createSectionType,
    updateSectionType,
    SectionTypeActionState,
} from "@/lib/actions/sections";
import { useRouter } from "next/navigation";

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

interface SectionTypeFormProps {
    mode: "create" | "edit";
    yearId: string;
    typeId?: string;
    defaultValues?: {
        label?: string;
        slug?: string;
        icon?: string | null;
        pageTitle?: string | null;
        pageSubtitle?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
    };
    open: boolean;
    onClose: () => void;
}

export function SectionTypeForm({
    mode,
    yearId,
    typeId,
    defaultValues,
    open,
    onClose,
}: SectionTypeFormProps) {
    const router = useRouter();
    const [slugManual, setSlugManual] = useState(
        mode === "edit"
    );
    const [slug, setSlug] = useState(
        defaultValues?.slug || ""
    );

    const action =
        mode === "create"
            ? createSectionType.bind(null, yearId)
            : updateSectionType.bind(null, typeId as string);

    const [state, formAction, isPending] = useActionState<
        SectionTypeActionState,
        FormData
    >(action, null);

    useEffect(() => {
        if (state?.success) {
            onClose();
            router.refresh();
        }
    }, [state, onClose, router]);

    const handleLabelChange = (value: string) => {
        if (!slugManual) {
            setSlug(slugify(value));
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <Box component="form" action={formAction}>
                <DialogTitle>
                    {mode === "create"
                        ? "Nový typ sekce"
                        : "Upravit typ sekce"}
                </DialogTitle>
                <DialogContent>
                    {state?.error?._form && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                        >
                            {state.error._form[0]}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        required
                        fullWidth
                        margin="dense"
                        name="label"
                        label="Název"
                        defaultValue={
                            defaultValues?.label || ""
                        }
                        error={!!state?.error?.label}
                        helperText={
                            state?.error?.label?.[0]
                        }
                        onChange={(e) =>
                            handleLabelChange(
                                e.target.value
                            )
                        }
                    />

                    <TextField
                        required
                        fullWidth
                        margin="dense"
                        name="slug"
                        label="Slug (URL)"
                        value={slug}
                        onChange={(e) => {
                            setSlug(e.target.value);
                            setSlugManual(true);
                        }}
                        error={!!state?.error?.slug}
                        helperText={
                            state?.error?.slug?.[0] ||
                            `Veřejná stránka bude na /${slug}`
                        }
                    />

                    <Accordion
                        disableGutters
                        elevation={0}
                        sx={{ mt: 2, "&:before": { display: "none" } }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                        >
                            <Typography variant="body2">
                                Nastavení veřejné stránky
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                            }}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                name="pageTitle"
                                label="Titulek stránky"
                                defaultValue={
                                    defaultValues?.pageTitle ||
                                    ""
                                }
                            />
                            <TextField
                                fullWidth
                                size="small"
                                name="pageSubtitle"
                                label="Podtitulek stránky"
                                defaultValue={
                                    defaultValues?.pageSubtitle ||
                                    ""
                                }
                            />
                            <TextField
                                fullWidth
                                size="small"
                                name="metaTitle"
                                label="Meta titulek"
                                defaultValue={
                                    defaultValues?.metaTitle ||
                                    ""
                                }
                                helperText="Pro SEO, např. 'Info | Helmáč'"
                            />
                            <TextField
                                fullWidth
                                size="small"
                                name="metaDescription"
                                label="Meta popis"
                                defaultValue={
                                    defaultValues?.metaDescription ||
                                    ""
                                }
                                multiline
                                rows={2}
                            />
                        </AccordionDetails>
                    </Accordion>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        Zrušit
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isPending}
                        startIcon={
                            isPending ? (
                                <CircularProgress
                                    size={20}
                                    color="inherit"
                                />
                            ) : null
                        }
                    >
                        {isPending
                            ? "Ukládám..."
                            : mode === "create"
                              ? "Vytvořit"
                              : "Uložit"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
