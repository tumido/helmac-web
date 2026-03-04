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
    Paper,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Add, Save, Visibility, Edit, Delete } from "@mui/icons-material";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    rectIntersection,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
    type CollisionDetection,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { FieldTypeSelector } from "./field-type-selector";
import { FieldEditor } from "./field-editor";
import { FieldListItem } from "./field-list-item";
import { FieldPalette } from "./field-palette";
import { SortableFieldItem } from "./sortable-field-item";
import { FormPreview } from "./form-preview";
import { saveRegistrationForm, deleteRegistrationForm } from "@/lib/actions/registration-forms";
import { FIELD_TYPE_META } from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";
import type { FormField, FieldType, InputField, HeadingField, DescriptionField } from "@/lib/types/registration-form";

interface FormBuilderProps {
    yearId: string;
    initialFields: FormField[] | null;
}

export function FormBuilder({ yearId, initialFields }: FormBuilderProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [fields, setFields] = useState<FormField[]>(initialFields || []);
    const [mode, setMode] = useState<"edit" | "preview">("edit");
    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const createField = useCallback((type: FieldType, fields: FormField[]): FormField => {
        const id = crypto.randomUUID();

        if (type === "heading") {
            return { type: "heading", id, text: "Nový nadpis" } as HeadingField;
        } else if (type === "description") {
            return { type: "description", id, text: "Popisek textu" } as DescriptionField;
        } else {
            const fieldCount = fields.filter((f) => f.type !== "heading" && f.type !== "description").length;
            return {
                type,
                id,
                name: `field_${fieldCount + 1}`,
                label: `Pole ${fieldCount + 1}`,
                required: false,
                options: type === "select" || type === "radio" ? ["Možnost 1"] : undefined,
            } as InputField;
        }
    }, []);

    const handleAddField = useCallback((type: FieldType) => {
        setFields((prev) => {
            const newField = createField(type, prev);
            setEditingField(newField);
            return [...prev, newField];
        });
    }, [createField]);

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

    // Custom collision detection: prefer sortable items, fall back to droppable zone
    const collisionDetection: CollisionDetection = useCallback((args) => {
        // First try closestCenter among sortable items
        const closestCenterCollisions = closestCenter(args);
        if (closestCenterCollisions.length > 0) {
            return closestCenterCollisions;
        }

        // Fall back to pointerWithin for the drop zone container
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        // Last resort: rectIntersection
        return rectIntersection(args);
    }, []);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        const activeIdStr = String(active.id);

        // Palette drop → create new field
        if (activeIdStr.startsWith("palette-")) {
            const type = activeIdStr.replace("palette-", "") as FieldType;

            setFields((prev) => {
                const newField = createField(type, prev);

                if (over) {
                    const overIdStr = String(over.id);
                    const overIndex = prev.findIndex((f) => f.id === overIdStr);

                    if (overIndex !== -1) {
                        // Insert after the item we're hovering over
                        const updated = [...prev];
                        updated.splice(overIndex + 1, 0, newField);
                        setEditingField(newField);
                        return updated;
                    }
                }

                // Append to end
                setEditingField(newField);
                return [...prev, newField];
            });
            return;
        }

        // Internal reorder
        if (over && active.id !== over.id) {
            setFields((prev) => {
                const oldIndex = prev.findIndex((f) => f.id === activeIdStr);
                const newIndex = prev.findIndex((f) => f.id === String(over.id));
                if (oldIndex === -1 || newIndex === -1) return prev;
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }, [createField]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    // Render the drag overlay content
    const renderDragOverlay = () => {
        if (!activeId) return null;

        if (activeId.startsWith("palette-")) {
            const type = activeId.replace("palette-", "") as FieldType;
            const meta = FIELD_TYPE_META[type];
            return (
                <Paper
                    variant="outlined"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        backgroundColor: "background.paper",
                        borderColor: "primary.main",
                        width: 200,
                    }}
                >
                    <Box sx={{ color: "primary.main", display: "flex" }}>
                        {FIELD_TYPE_ICONS[meta.icon]}
                    </Box>
                    <Typography variant="body2">{meta.label}</Typography>
                </Paper>
            );
        }

        // Existing field overlay
        const field = fields.find((f) => f.id === activeId);
        if (field) {
            const meta = FIELD_TYPE_META[field.type];
            return (
                <Paper elevation={4} sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                        {meta.label}: {"label" in field ? field.label : field.text}
                    </Typography>
                </Paper>
            );
        }

        return null;
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

                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving || fields.length === 0}
                >
                    {saving ? "Ukládám..." : "Uložit formulář"}
                </Button>
            </Box>

            {mode === "edit" ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={collisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <Box sx={{ display: "flex", gap: 3 }}>
                        {/* Left column: field list */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <FieldDropZone
                                fields={fields}
                                onEdit={handleEditField}
                                onDelete={handleDeleteField}
                            />

                            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                                {isMobile && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => setTypeSelectorOpen(true)}
                                    >
                                        Přidat pole
                                    </Button>
                                )}
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
                            </Box>
                        </Box>

                        {/* Right column: palette (desktop only) */}
                        {!isMobile && (
                            <Box sx={{ width: 220, flexShrink: 0 }}>
                                <FieldPalette />
                            </Box>
                        )}
                    </Box>

                    <DragOverlay dropAnimation={null}>
                        {renderDragOverlay()}
                    </DragOverlay>
                </DndContext>
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

// Drop zone component for the field list
interface FieldDropZoneProps {
    fields: FormField[];
    onEdit: (field: FormField) => void;
    onDelete: (fieldId: string) => void;
}

function FieldDropZone({ fields, onEdit, onDelete }: FieldDropZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: "field-list-droppable",
    });

    return (
        <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
        >
            <Box
                ref={setNodeRef}
                sx={{
                    minHeight: 100,
                    border: "2px dashed",
                    borderColor: isOver ? "primary.main" : "transparent",
                    borderRadius: 1,
                    backgroundColor: isOver ? "action.hover" : "transparent",
                    transition: "all 0.2s ease",
                    p: fields.length === 0 ? 0 : 0.5,
                }}
            >
                {fields.length === 0 ? (
                    <Typography
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 4 }}
                    >
                        Formulář je prázdný. Přetáhněte pole z palety nebo použijte tlačítko.
                    </Typography>
                ) : (
                    fields.map((field) => (
                        <SortableFieldItem key={field.id} id={field.id}>
                            <FieldListItem
                                field={field}
                                onEdit={() => onEdit(field)}
                                onDelete={() => onDelete(field.id)}
                            />
                        </SortableFieldItem>
                    ))
                )}
            </Box>
        </SortableContext>
    );
}
