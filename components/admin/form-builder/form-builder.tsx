"use client";

import { useState, useCallback } from "react";
import {
    Box,
    Button,
    Alert,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { Add, Save, Visibility, Edit, Delete } from "@mui/icons-material";
import { SortableList } from "@/components/admin/sortable-list";
import { FieldTypeSelector } from "./field-type-selector";
import { FieldEditor } from "./field-editor";
import { FieldListItem } from "./field-list-item";
import { FormPreview } from "./form-preview";
import { saveRegistrationForm, deleteRegistrationForm } from "@/lib/actions/registration-forms";
import type { FormField, FieldType, InputField, HeadingField, DescriptionField } from "@/lib/types/registration-form";

interface FormBuilderProps {
    yearId: string;
    initialFields: FormField[] | null;
}

export function FormBuilder({ yearId, initialFields }: FormBuilderProps) {
    const [fields, setFields] = useState<FormField[]>(initialFields || []);
    const [mode, setMode] = useState<"edit" | "preview">("edit");
    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleAddField = useCallback((type: FieldType) => {
        const id = crypto.randomUUID();

        let newField: FormField;
        if (type === "heading") {
            newField = { type: "heading", id, text: "Nový nadpis" } as HeadingField;
        } else if (type === "description") {
            newField = { type: "description", id, text: "Popisek textu" } as DescriptionField;
        } else {
            const fieldCount = fields.filter((f) => f.type !== "heading" && f.type !== "description").length;
            newField = {
                type,
                id,
                name: `field_${fieldCount + 1}`,
                label: `Pole ${fieldCount + 1}`,
                required: false,
                options: type === "select" || type === "radio" ? ["Možnost 1"] : undefined,
            } as InputField;
        }

        setFields((prev) => [...prev, newField]);
        setEditingField(newField);
    }, [fields]);

    const handleEditField = useCallback((field: FormField) => {
        setEditingField(field);
    }, []);

    const handleSaveField = useCallback((updatedField: FormField) => {
        setFields((prev) => prev.map((f) => (f.id === updatedField.id ? updatedField : f)));
        setEditingField(null);
    }, []);

    const handleDeleteField = useCallback((fieldId: string) => {
        setFields((prev) => prev.filter((f) => f.id !== fieldId));
    }, []);

    const handleReorder = useCallback((newOrder: string[]) => {
        setFields((prev) => {
            const fieldMap = new Map(prev.map((f) => [f.id, f]));
            return newOrder.map((id) => fieldMap.get(id)!).filter(Boolean);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const result = await saveRegistrationForm(yearId, fields);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        setDeleteConfirmOpen(false);

        const result = await deleteRegistrationForm(yearId);

        if (result.error) {
            setError(typeof result.error === "string" ? result.error : "Nepodařilo se smazat formulář");
        } else {
            setFields([]);
        }
        setDeleting(false);
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Formulář byl uložen
                </Alert>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                    Registrační formulář
                </Typography>

                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={(_e, v) => v && setMode(v)}
                    size="small"
                >
                    <ToggleButton value="edit">
                        <Edit fontSize="small" sx={{ mr: 0.5 }} />
                        Upravit
                    </ToggleButton>
                    <ToggleButton value="preview">
                        <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                        Náhled
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {mode === "edit" ? (
                <>
                    {fields.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                            Formulář je prázdný. Začněte přidáním pole.
                        </Typography>
                    ) : (
                        <SortableList
                            items={fields}
                            getId={(f) => f.id}
                            renderItem={(field) => (
                                <FieldListItem
                                    field={field}
                                    onEdit={() => handleEditField(field)}
                                    onDelete={() => handleDeleteField(field.id)}
                                />
                            )}
                            onReorder={handleReorder}
                        />
                    )}

                    <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setTypeSelectorOpen(true)}
                        >
                            Přidat pole
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        {initialFields && initialFields.length > 0 && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={deleting}
                            >
                                Smazat formulář
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving || fields.length === 0}
                        >
                            {saving ? "Ukládám..." : "Uložit formulář"}
                        </Button>
                    </Box>
                </>
            ) : (
                <FormPreview fields={fields} />
            )}

            <FieldTypeSelector
                open={typeSelectorOpen}
                onClose={() => setTypeSelectorOpen(false)}
                onSelect={handleAddField}
            />

            <FieldEditor
                open={!!editingField}
                field={editingField}
                allFields={fields}
                onClose={() => setEditingField(null)}
                onSave={handleSaveField}
            />

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Smazat formulář?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tato akce smaže registrační formulář a všechny přijaté registrace. Tuto akci nelze vrátit.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Zrušit</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
