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
import { LinkButton } from "@/components/ui/link-button";
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
                  ? "Vytvorit rocnik"
                  : "Ulozit zmeny"}
        </Button>
    );
}

function formatDateForInput(date: Date | null | undefined): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

export function YearForm({ mode, yearId, defaultValues }: YearFormProps) {
    const action =
        mode === "create"
            ? createYear
            : updateYear.bind(null, yearId as string);

    const [state, formAction] = useActionState<YearActionState, FormData>(
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
                            label="Nazev rocniku"
                            defaultValue={defaultValues?.title || ""}
                            error={!!state?.error?.title}
                            helperText={state?.error?.title?.[0]}
                            placeholder="napr. Helmac 2025"
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
                        placeholder="napr. Tema rocniku nebo popis"
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
                            label="Datum zacatku"
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
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href="/admin/rocniky">
                        Zrusit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
