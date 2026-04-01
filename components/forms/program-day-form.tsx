"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Save } from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
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
                  ? "Vytvorit den"
                  : "Uložit změny"}
        </Button>
    );
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

    const [dateValue, setDateValue] = useState<Dayjs | null>(
        defaultValues?.date ? dayjs(defaultValues.date) : null
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
                        <Box>
                            <DatePicker
                                label="Datum"
                                value={dateValue}
                                onChange={(v) => setDateValue(v)}
                                format="DD.MM.YYYY"
                                slotProps={{
                                    textField: {
                                        required: true,
                                        fullWidth: true,
                                        error: !!state?.error?.date,
                                        helperText: state?.error?.date?.[0],
                                    },
                                }}
                            />
                            <input
                                type="hidden"
                                name="date"
                                value={dateValue?.format("YYYY-MM-DD") ?? ""}
                            />
                        </Box>

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
                                'Např. "Den 1", "Pátek"...'
                            }
                            placeholder="Den 1"
                            inputProps={{ maxLength: 50 }}
                        />
                    </Box>

                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={`/admin/rocniky/${yearId}/program`}>
                        Zrušit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
