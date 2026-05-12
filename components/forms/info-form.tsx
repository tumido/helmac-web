"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Switch,
    FormControlLabel,
} from "@mui/material";
import { Save } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { createInfoSection, updateInfoSection, InfoSectionActionState } from "@/lib/actions/info";
import { BlockEditor } from "@/components/admin/block-editor";
import { IconPicker } from "@/components/admin/icon-picker";
import { TocPreview } from "@/components/admin/toc-preview";
import type { ContentBlock } from "@/lib/types/content-blocks";

interface InfoFormProps {
    mode: "create" | "edit";
    yearId: string;
    infoId?: string;
    defaultValues?: {
        title?: string;
        subtitle?: string | null;
        content?: ContentBlock[];
        showToc?: boolean;
        icon?: string | null;
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
    const [blocks, setBlocks] = useState<ContentBlock[]>(
        defaultValues?.content || []
    );
    const [showToc, setShowToc] = useState(defaultValues?.showToc || false);
    const [icon, setIcon] = useState<string | null>(defaultValues?.icon || null);

    const action =
        mode === "create"
            ? createInfoSection.bind(null, yearId)
            : updateInfoSection.bind(null, infoId as string);

    const [state, formAction] = useActionState<InfoSectionActionState, FormData>(
        action,
        null
    );

    return (
        <Box
            component="form"
            action={formAction}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    mb: 2,
                }}
            >
                <IconPicker value={icon} onChange={setIcon} />
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        width: 360,
                    }}
                >
                    <TextField
                        required
                        size="small"
                        id="title"
                        name="title"
                        label="Název info sekce"
                        defaultValue={defaultValues?.title || ""}
                        error={!!state?.error?.title}
                        helperText={state?.error?.title?.[0]}
                    />
                    <TextField
                        size="small"
                        id="subtitle"
                        name="subtitle"
                        label="Podtitulek"
                        defaultValue={defaultValues?.subtitle || ""}
                    />
                </Box>
                <Box sx={{ flex: 1 }} />
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        alignItems: "flex-end",
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <LinkButton
                            href={`/admin/rocniky/${yearId}/info`}
                            variant="outlined"
                        >
                            Zrušit
                        </LinkButton>
                        <SubmitButton mode={mode} />
                    </Box>
                    <FormControlLabel
                        labelPlacement="start"
                        control={
                            <Switch
                                name="showToc"
                                value="true"
                                size="small"
                                checked={showToc}
                                onChange={(e) =>
                                    setShowToc(e.target.checked)
                                }
                            />
                        }
                        label="Zobrazit obsah"
                        sx={{ py: 0.75, mr: 0 }}
                    />
                </Box>
            </Box>

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

            <TocPreview show={showToc} blocks={blocks}>
                <BlockEditor
                    value={blocks}
                    onChange={setBlocks}
                    yearId={yearId}
                />
            </TocPreview>
        </Box>
    );
}
