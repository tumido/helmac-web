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
import { createRule, updateRule, RuleActionState } from "@/lib/actions/rules";
import { BlockEditor } from "@/components/admin/block-editor";
import { IconPicker } from "@/components/admin/icon-picker";
import type { ContentBlock } from "@/lib/types/content-blocks";

interface RuleFormProps {
    mode: "create" | "edit";
    yearId: string;
    ruleId?: string;
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
                  ? "Vytvořit pravidlo"
                  : "Uložit změny"}
        </Button>
    );
}

export function RuleForm({ mode, yearId, ruleId, defaultValues }: RuleFormProps) {
    const [blocks, setBlocks] = useState<ContentBlock[]>(
        defaultValues?.content || []
    );
    const [showToc, setShowToc] = useState(defaultValues?.showToc || false);
    const [icon, setIcon] = useState<string | null>(defaultValues?.icon || null);

    const action =
        mode === "create"
            ? createRule.bind(null, yearId)
            : updateRule.bind(null, ruleId as string);

    const [state, formAction] = useActionState<RuleActionState, FormData>(
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
                    label="Název pravidla"
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
                <IconPicker value={icon} onChange={setIcon} />
                <FormControlLabel
                    control={
                        <Switch
                            name="showToc"
                            value="true"
                            size="small"
                            checked={showToc}
                            onChange={(e) => setShowToc(e.target.checked)}
                        />
                    }
                    label="Zobrazit obsah"
                />
                <SubmitButton mode={mode} />
                <LinkButton
                    href={`/admin/rocniky/${yearId}/pravidla`}
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

            <BlockEditor
                value={blocks}
                onChange={setBlocks}
                yearId={yearId}
            />
        </Box>
    );
}
