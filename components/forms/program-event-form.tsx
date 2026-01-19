"use client";

import { useActionState, useState } from "react";
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
    Autocomplete,
    Chip,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import {
    createProgramEvent,
    updateProgramEvent,
    ProgramEventActionState,
} from "@/lib/actions/program-events";

interface ProgramEventFormProps {
    mode: "create" | "edit";
    yearId: string;
    dayId: string;
    eventId?: string;
    existingTags?: string[];
    defaultValues?: {
        startTime?: string;
        title?: string;
        description?: string;
        location?: string;
        imageUrl?: string | null;
        tags?: string[];
        isPublished?: boolean;
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
                  ? "Vytvorit udalost"
                  : "Ulozit zmeny"}
        </Button>
    );
}

export function ProgramEventForm({
    mode,
    yearId,
    dayId,
    eventId,
    existingTags = [],
    defaultValues,
}: ProgramEventFormProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>(
        defaultValues?.tags || []
    );

    const action =
        mode === "create"
            ? async (prevState: ProgramEventActionState, formData: FormData) => {
                  formData.set("yearId", yearId);
                  return createProgramEvent(dayId, prevState, formData);
              }
            : updateProgramEvent.bind(null, eventId as string);

    const [state, formAction] = useActionState<ProgramEventActionState, FormData>(
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
                                sm: "1fr 2fr",
                            },
                            gap: 3,
                        }}
                    >
                        <TextField
                            required
                            fullWidth
                            type="time"
                            id="startTime"
                            name="startTime"
                            label="Cas zacatku"
                            defaultValue={defaultValues?.startTime || ""}
                            error={!!state?.error?.startTime}
                            helperText={state?.error?.startTime?.[0]}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            required
                            fullWidth
                            id="title"
                            name="title"
                            label="Nazev udalosti"
                            defaultValue={defaultValues?.title || ""}
                            error={!!state?.error?.title}
                            helperText={state?.error?.title?.[0]}
                            inputProps={{ maxLength: 200 }}
                        />
                    </Box>

                    <TextField
                        required
                        fullWidth
                        id="description"
                        name="description"
                        label="Popis"
                        defaultValue={defaultValues?.description || ""}
                        error={!!state?.error?.description}
                        helperText={state?.error?.description?.[0]}
                        multiline
                        rows={4}
                        inputProps={{ maxLength: 2000 }}
                    />

                    <TextField
                        required
                        fullWidth
                        id="location"
                        name="location"
                        label="Misto konani"
                        defaultValue={defaultValues?.location || ""}
                        error={!!state?.error?.location}
                        helperText={state?.error?.location?.[0]}
                        placeholder="Hlavni stan, Namesti, Arena..."
                        inputProps={{ maxLength: 200 }}
                    />

                    <TextField
                        fullWidth
                        id="imageUrl"
                        name="imageUrl"
                        label="URL obrazku (volitelne)"
                        defaultValue={defaultValues?.imageUrl || ""}
                        error={!!state?.error?.imageUrl}
                        helperText={state?.error?.imageUrl?.[0]}
                        placeholder="https://example.com/image.jpg"
                    />

                    <Autocomplete
                        multiple
                        freeSolo
                        id="tags"
                        options={existingTags}
                        value={selectedTags}
                        onChange={(_, newValue) => {
                            setSelectedTags(newValue as string[]);
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key}
                                        variant="outlined"
                                        label={option}
                                        {...tagProps}
                                        size="small"
                                    />
                                );
                            })
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Tagy"
                                placeholder="Pridejte tagy..."
                                helperText={
                                    state?.error?.tags?.[0] ||
                                    "Stisknutim Enter pridejte novy tag"
                                }
                                error={!!state?.error?.tags}
                            />
                        )}
                    />
                    <input
                        type="hidden"
                        name="tags"
                        value={JSON.stringify(selectedTags)}
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
                        label="Publikovat udalost"
                    />

                    {mode === "edit" && (
                        <TextField
                            fullWidth
                            type="number"
                            id="sortOrder"
                            name="sortOrder"
                            label="Poradi"
                            defaultValue={defaultValues?.sortOrder ?? 0}
                            helperText="Urcuje poradi v ramci casove skupiny"
                            inputProps={{ min: 0 }}
                        />
                    )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={`/admin/rocniky/${yearId}/program/${dayId}`}>
                        Zrusit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
