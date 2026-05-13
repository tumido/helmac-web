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
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Save, Settings } from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
import { LinkButton } from "@/components/ui/link-button";
import { builderPalette as p } from "@/components/admin/email-builder/palette";
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
                pending ? (
                    <CircularProgress
                        size={20}
                        color="inherit"
                    />
                ) : (
                    <Save />
                )
            }
        >
            {pending
                ? "Ukládám..."
                : mode === "create"
                  ? "Vytvořit den"
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

    const [state, formAction] =
        useActionState<ProgramDayActionState, FormData>(
            action,
            null
        );

    const [dateValue, setDateValue] =
        useState<Dayjs | null>(
            defaultValues?.date
                ? dayjs(defaultValues.date)
                : null
        );

    return (
        <Box
            sx={{
                backgroundColor: p.surface,
                border: `1px solid ${p.line}`,
                borderRadius: "14px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* head */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${p.line}`,
                    background: `linear-gradient(180deg, ${p.surface}, ${p.surface2})`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <Settings
                    sx={{
                        fontSize: 16,
                        color: p.ink3,
                    }}
                />
                <Typography
                    sx={{
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: p.ink3,
                        fontWeight: 700,
                        flex: 1,
                    }}
                    noWrap
                >
                    Nastavení dne
                </Typography>
            </Box>

            {/* body */}
            <Box
                component="form"
                action={formAction}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        backgroundColor: p.surface2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                    }}
                >
                    {state?.error?._form && (
                        <Alert severity="error">
                            {state.error._form[0]}
                        </Alert>
                    )}

                    <Box>
                        <DatePicker
                            label="Datum"
                            value={dateValue}
                            onChange={(v) =>
                                setDateValue(v)
                            }
                            format="DD.MM.YYYY"
                            slotProps={{
                                textField: {
                                    required: true,
                                    fullWidth: true,
                                    error: !!state?.error
                                        ?.date,
                                    helperText:
                                        state?.error
                                            ?.date?.[0],
                                },
                            }}
                        />
                        <input
                            type="hidden"
                            name="date"
                            value={
                                dateValue?.format(
                                    "YYYY-MM-DD"
                                ) ?? ""
                            }
                        />
                    </Box>

                    <TextField
                        required
                        fullWidth
                        id="label"
                        name="label"
                        label="Popisek"
                        defaultValue={
                            defaultValues?.label || ""
                        }
                        error={!!state?.error?.label}
                        helperText={
                            state?.error?.label?.[0] ||
                            'Např. "Den 1", "Pátek"...'
                        }
                        placeholder="Den 1"
                        inputProps={{ maxLength: 50 }}
                    />
                </Box>

                {/* foot */}
                <Box
                    sx={{
                        p: "10px",
                        borderTop: `1px solid ${p.line}`,
                        backgroundColor: p.surface2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <SubmitButton mode={mode} />
                    <LinkButton
                        href={`/admin/rocniky/${yearId}/program`}
                    >
                        Zrušit
                    </LinkButton>
                </Box>
            </Box>
        </Box>
    );
}
