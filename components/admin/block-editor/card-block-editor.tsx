"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { CardBlock, CardButton, CardButtonVariant } from "@/lib/types/content-blocks";
import {
    getLinkTargets,
    type LinkTarget,
} from "@/lib/actions/link-targets";

interface CardBlockEditorProps {
    block: CardBlock;
    onChange: (block: CardBlock) => void;
    yearId?: string;
}

export function CardBlockEditor({
    block,
    onChange,
    yearId,
}: CardBlockEditorProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [btnLabel, setBtnLabel] = useState("");
    const [btnHref, setBtnHref] = useState("");
    const [btnVariant, setBtnVariant] = useState<CardButtonVariant>("contained");

    const [linkTargets, setLinkTargets] = useState<LinkTarget[] | null>(null);
    const [linkTargetsLoading, startLoadTargets] = useTransition();

    useEffect(() => {
        startLoadTargets(async () => {
            const targets = await getLinkTargets(yearId);
            setLinkTargets(targets);
        });
    }, [yearId]);

    const openAddDialog = () => {
        setBtnLabel("");
        setBtnHref("");
        setBtnVariant("contained");
        setEditingIndex(null);
        setDialogOpen(true);
    };

    const openEditDialog = (index: number) => {
        const btn = block.buttons[index];
        setBtnLabel(btn.label);
        setBtnHref(btn.href);
        setBtnVariant(btn.variant);
        setEditingIndex(index);
        setDialogOpen(true);
    };

    const submitButton = () => {
        if (editingIndex !== null) {
            const updated = block.buttons.map((btn, i) =>
                i === editingIndex
                    ? { ...btn, label: btnLabel, href: btnHref, variant: btnVariant }
                    : btn
            );
            onChange({ ...block, buttons: updated });
        } else {
            const newBtn: CardButton = {
                id: crypto.randomUUID(),
                label: btnLabel,
                href: btnHref,
                variant: btnVariant,
            };
            onChange({ ...block, buttons: [...block.buttons, newBtn] });
        }
        setDialogOpen(false);
    };

    const deleteButton = (index: number) => {
        onChange({
            ...block,
            buttons: block.buttons.filter((_, i) => i !== index),
        });
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1,
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    flexShrink: 0,
                    overflow: "hidden",
                    maxHeight: 120,
                    "& > div > div": {
                        minHeight: "unset !important",
                        height: "100%",
                        p: 1,
                    },
                    "& img": {
                        maxHeight: "100%",
                        objectFit: "contain",
                    },
                }}
            >
                <ImageUploader
                    value={block.imageUrl}
                    onChange={(url) =>
                        onChange({ ...block, imageUrl: url })
                    }
                />
            </Box>
            <TextField
                size="small"
                label="Nadpis"
                value={block.title}
                onChange={(e) =>
                    onChange({ ...block, title: e.target.value })
                }
                fullWidth
            />
            <Box sx={{ flex: 1, minHeight: 60 }}>
                <RichTextEditor
                    value={block.text}
                    onChange={(text) =>
                        onChange({ ...block, text })
                    }
                    minHeight={60}
                    yearId={yearId}
                    allowedTools={[
                        "formatting",
                        "h3",
                        "lists",
                        "inserts",
                        "undo",
                    ]}
                />
            </Box>

            {/* Button list */}
            <Box sx={{ flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                {block.buttons.map((btn, i) => (
                    <Button
                        key={btn.id}
                        variant={btn.variant}
                        onClick={() => openEditDialog(i)}
                        endIcon={
                            <Delete
                                sx={{
                                    fontSize: "14px !important",
                                    opacity: 0,
                                    transition: "opacity 0.15s",
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteButton(i);
                                }}
                            />
                        }
                        sx={{
                            textTransform: "none",
                            "&:hover .MuiButton-endIcon svg": {
                                opacity: 1,
                            },
                        }}
                    >
                        {btn.label || "(bez textu)"}
                    </Button>
                ))}
                {block.buttons.length === 0 ? (
                    <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={openAddDialog}
                    >
                        Přidat tlačítko
                    </Button>
                ) : (
                    <IconButton
                        size="small"
                        onClick={openAddDialog}
                        sx={{ color: "primary.main" }}
                    >
                        <Add sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
            </Box>

            {/* Button dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>
                    {editingIndex !== null
                        ? "Upravit tlačítko"
                        : "Přidat tlačítko"}
                </DialogTitle>
                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        pt: "8px !important",
                    }}
                >
                    <TextField
                        autoFocus
                        label="Text tlačítka"
                        value={btnLabel}
                        onChange={(e) => setBtnLabel(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <TextField
                        label="Odkaz (URL)"
                        value={btnHref}
                        onChange={(e) => setBtnHref(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <Autocomplete<LinkTarget>
                        options={linkTargets ?? []}
                        loading={linkTargetsLoading}
                        groupBy={(option) => option.group}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) =>
                            option.url === value.url
                        }
                        value={null}
                        onChange={(_, value) => {
                            if (value) {
                                setBtnHref(value.url);
                                if (!btnLabel) {
                                    setBtnLabel(value.label);
                                }
                            }
                        }}
                        blurOnSelect
                        size="small"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Vybrat stránku webu"
                                placeholder="Vyhledat stránku"
                                variant="outlined"
                            />
                        )}
                    />
                    <ToggleButtonGroup
                        exclusive
                        value={btnVariant}
                        onChange={(_, v) => {
                            if (v) setBtnVariant(v);
                        }}
                        size="small"
                        fullWidth
                    >
                        <ToggleButton value="contained">
                            Vyplněné
                        </ToggleButton>
                        <ToggleButton value="outlined">
                            Obrysové
                        </ToggleButton>
                        <ToggleButton value="text">
                            Textové
                        </ToggleButton>
                    </ToggleButtonGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Zrušit
                    </Button>
                    <Button
                        onClick={submitButton}
                        variant="contained"
                        disabled={!btnLabel.trim()}
                    >
                        {editingIndex !== null ? "Uložit" : "Přidat"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
