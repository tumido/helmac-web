"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Paper,
    Switch,
    FormControlLabel,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createOffer, updateOffer, OfferActionState } from "@/lib/actions/offers";
import { BlockEditor } from "@/components/admin/block-editor";
import type { ContentBlock } from "@/lib/types/content-blocks";

interface OfferFormProps {
    mode: "create" | "edit";
    yearId: string;
    offerId?: string;
    defaultValues?: {
        title?: string;
        subtitle?: string | null;
        content?: ContentBlock[];
        showToc?: boolean;
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
                  ? "Vytvořit nabídku"
                  : "Uložit změny"}
        </Button>
    );
}

export function OfferForm({ mode, yearId, offerId, defaultValues }: OfferFormProps) {
    const [blocks, setBlocks] = useState<ContentBlock[]>(
        defaultValues?.content || []
    );
    const [showToc, setShowToc] = useState(defaultValues?.showToc || false);

    const action =
        mode === "create"
            ? createOffer.bind(null, yearId)
            : updateOffer.bind(null, offerId as string);

    const [state, formAction] = useActionState<OfferActionState, FormData>(
        action,
        null
    );

    return (
        <Box
            component="form"
            action={formAction}
        >
            {/* Toolbar */}
            <Paper
                variant="outlined"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1,
                    mb: 3,
                    flexWrap: "wrap",
                    borderRadius: 2,
                }}
            >
                <TextField
                    required
                    size="small"
                    id="title"
                    name="title"
                    label="Název nabídky"
                    defaultValue={defaultValues?.title || ""}
                    error={!!state?.error?.title}
                    helperText={state?.error?.title?.[0]}
                    sx={{ minWidth: 200, flex: 1 }}
                />
                <TextField
                    size="small"
                    id="subtitle"
                    name="subtitle"
                    label="Podtitulek"
                    defaultValue={defaultValues?.subtitle || ""}
                    sx={{ minWidth: 150, flex: 1 }}
                />
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={showToc}
                            onChange={(e) => setShowToc(e.target.checked)}
                        />
                    }
                    label="TOC"
                />
                <SubmitButton mode={mode} />
                <LinkButton
                    href={`/admin/rocniky/${yearId}/nabidka`}
                    variant="outlined"
                    size="small"
                >
                    Zrušit
                </LinkButton>
            </Paper>

            {state?.error?._form && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {state.error._form[0]}
                </Alert>
            )}
            {state?.error?.content && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {state.error.content[0]}
                </Alert>
            )}

            <input type="hidden" name="content" value={JSON.stringify(blocks)} />
            <input type="hidden" name="showToc" value={showToc ? "true" : "false"} />

            <BlockEditor
                value={blocks}
                onChange={setBlocks}
                yearId={yearId}
            />
        </Box>
    );
}
