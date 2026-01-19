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
import {
    createProgramDay,
    updateProgramDay,
    ProgramDayActionState,
} from "@/lib/actions/program-days";

interface ProgramDayFormProps {
    mode: "create" | "edit";
    yearId: string;
    dayId?: string;
    defaultValues?: {
        date?: Date;
        label?: string;
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
                ? "Ukladam..."
                : mode === "create"
                  ? "Vytvorit den"
                  : "Ulozit zmeny"}
        </Button>
    );
}

function formatDateForInput(date?: Date): string {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

export function ProgramDayForm({
    mode,
    yearId,
    dayId,
    defaultValues,
}: ProgramDayFormProps) {
    const action =
        mode === "create"
            ? createProgramDay.bind(null, yearId)
            : updateProgramDay.bind(null, dayId as string);

    const [state, formAction] = useActionState<ProgramDayActionState, FormData>(
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
                                sm: "1fr 1fr",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required
                            fullWidth
                            type="date"
                            id="date"
                            name="date"
                            label="Datum"
                            defaultValue={formatDateForInput(defaultValues?.date)}
                            error={!!state?.error?.date}
                            helperText={state?.error?.date?.[0]}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            required
                            fullWidth
                            id="label"
                            name="label"
                            label="Popisek"
                            defaultValue={defaultValues?.label || ""}
                            error={!!state?.error?.label}
                            helperText={
                                state?.error?.label?.[0] ||
                                'Napr. "Den 1", "Patek", "Pribytecne hry"'
                            }
                            placeholder="Den 1"
                            inputProps={{ maxLength: 50 }}
                        />
                    </Box>

                    {mode === "edit" && (
                        <TextField
                            fullWidth
                            type="number"
                            id="sortOrder"
                            name="sortOrder"
                            label="Poradi"
                            defaultValue={defaultValues?.sortOrder ?? 0}
                            error={!!state?.error?.sortOrder}
                            helperText={
                                state?.error?.sortOrder?.[0] ||
                                "Urcuje poradi zobrazeni dnu"
                            }
                            inputProps={{ min: 0 }}
                        />
                    )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={`/admin/rocniky/${yearId}/program`}>
                        Zrusit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
