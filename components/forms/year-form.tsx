"use client";

import { useState } from "react";
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
    Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { createYear, updateYear, YearActionState } from "@/lib/actions/years";

interface YearFormProps {
    mode: "create" | "edit";
    yearId?: string;
    defaultValues?: {
        year?: number;
        title?: string;
        subtitle?: string | null;
        startDate?: Date | null;
        endDate?: Date | null;
        headerPhoto?: string | null;
        heroPhoto?: string | null;
    };
    onCancel?: () => void;
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
                  ? "Vytvořit ročník"
                  : "Uložit změny"}
        </Button>
    );
}

function formatDateForInput(date: Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

export function YearForm({ mode, yearId, defaultValues, onCancel }: YearFormProps) {
    const action =
        mode === "create"
            ? createYear
            : updateYear.bind(null, yearId as string);

    const [state, formAction] = useActionState<YearActionState, FormData>(
        action,
        null
    );

    const [headerPhoto, setHeaderPhoto] = useState(defaultValues?.headerPhoto || "");
    const [heroPhoto, setHeroPhoto] = useState(defaultValues?.heroPhoto || "");

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

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required
                            fullWidth
                            id="year"
                            name="year"
                            label="Rok"
                            type="number"
                            defaultValue={defaultValues?.year || ""}
                            error={!!state?.error?.year}
                            helperText={state?.error?.year?.[0]}
                            inputProps={{ min: 2000, max: 2100 }}
                        />

                        <TextField
                            required
                            fullWidth
                            id="title"
                            name="title"
                            label="Název ročníku"
                            defaultValue={defaultValues?.title || ""}
                            error={!!state?.error?.title}
                            helperText={state?.error?.title?.[0]}
                            placeholder="např. Helmac 2025"
                        />
                    </Box>

                    <TextField
                        fullWidth
                        id="subtitle"
                        name="subtitle"
                        label="Podtitulek"
                        defaultValue={defaultValues?.subtitle || ""}
                        error={!!state?.error?.subtitle}
                        helperText={state?.error?.subtitle?.[0]}
                        placeholder="např. Téma ročníku nebo popis"
                    />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            fullWidth
                            id="startDate"
                            name="startDate"
                            label="Datum začátku"
                            type="date"
                            defaultValue={formatDateForInput(
                                defaultValues?.startDate
                            )}
                            error={!!state?.error?.startDate}
                            helperText={state?.error?.startDate?.[0]}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            id="endDate"
                            name="endDate"
                            label="Datum konce"
                            type="date"
                            defaultValue={formatDateForInput(
                                defaultValues?.endDate
                            )}
                            error={!!state?.error?.endDate}
                            helperText={state?.error?.endDate?.[0]}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Foto záhlaví podstránek
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Obrázek na pozadí záhlaví veřejných podstránek (Program, Pravidla, Galerie, apod.)
                        </Typography>
                        <ImageUploader
                            value={headerPhoto}
                            onChange={setHeaderPhoto}
                        />
                        <input type="hidden" name="headerPhoto" value={headerPhoto} />
                        {state?.error?.headerPhoto && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {state.error.headerPhoto[0]}
                            </Typography>
                        )}
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Foto hlavní sekce
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            Obrázek na pozadí úvodní sekce domovské stránky
                        </Typography>
                        <ImageUploader
                            value={heroPhoto}
                            onChange={setHeroPhoto}
                        />
                        <input type="hidden" name="heroPhoto" value={heroPhoto} />
                        {state?.error?.heroPhoto && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {state.error.heroPhoto[0]}
                            </Typography>
                        )}
                    </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    {onCancel ? (
                        <Button onClick={onCancel}>Zrušit</Button>
                    ) : (
                        <LinkButton href="/admin/rocniky">
                            Zrušit
                        </LinkButton>
                    )}
                </CardActions>
            </Box>
        </Card>
    );
}
