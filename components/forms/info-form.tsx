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
    Typography,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createInfoSection, updateInfoSection, InfoSectionActionState } from "@/lib/actions/info";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface InfoFormProps {
    mode: "create" | "edit";
    yearId: string;
    infoId?: string;
    defaultValues?: {
        title?: string;
        content?: string;
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
                  ? "Vytvořit info sekci"
                  : "Uložit změny"}
        </Button>
    );
}

export function InfoForm({ mode, yearId, infoId, defaultValues }: InfoFormProps) {
    const [content, setContent] = useState(defaultValues?.content || "");

    const action =
        mode === "create"
            ? createInfoSection.bind(null, yearId)
            : updateInfoSection.bind(null, infoId as string);

    const [state, formAction] = useActionState<InfoSectionActionState, FormData>(
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

                    <TextField
                        required
                        fullWidth
                        id="title"
                        name="title"
                        label="Název info sekce"
                        defaultValue={defaultValues?.title || ""}
                        error={!!state?.error?.title}
                        helperText={state?.error?.title?.[0]}
                    />

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Obsah *
                        </Typography>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            minHeight={300}
                        />
                        <input type="hidden" name="content" value={content} />
                        {state?.error?.content && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                {state.error.content[0]}
                            </Typography>
                        )}
                    </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                    <SubmitButton mode={mode} />
                    <LinkButton href={`/admin/rocniky/${yearId}/info`}>
                        Zrušit
                    </LinkButton>
                </CardActions>
            </Box>
        </Card>
    );
}
