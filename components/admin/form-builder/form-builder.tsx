"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Box,
    Button,
    Alert,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Paper,
    Tabs,
    Tab,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Add, Save, Visibility, Delete, TuneOutlined } from "@mui/icons-material";
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
    type DragOverEvent,
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
import { ConditionBlockItem } from "./condition-block-item";
import { ConditionEditor } from "./condition-editor";
import { PricingEditor } from "./pricing-editor";
import { saveRegistrationForm, deleteRegistrationForm } from "@/lib/actions/registration-forms";
import { FIELD_TYPE_META, getAllFields } from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";
import {
    getConditionsUsingField,
    getBrokenOptionRemovals,
    getFieldIdsUsedInConditions,
} from "@/lib/utils/condition-validation";
import type {
    FormField,
    FormElement,
    FormCondition,
    ConditionBlock,
    FieldType,
    InputField,
    HeadingField,
    DescriptionField,
    RegistrationFormData,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { isConditionBlock, isInputField } from "@/lib/types/registration-form";
import { getFieldOptionValues } from "@/lib/utils/pricing";

interface FormBuilderProps {
    yearId: string;
    initialFormData: RegistrationFormData;
}

export function FormBuilder({ yearId, initialFormData }: FormBuilderProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [elements, setElements] = useState<FormElement[]>(initialFormData.fields);
    const elementsRef = useRef(elements);
    useEffect(() => {
        elementsRef.current = elements;
    });
    const [conditions, setConditions] = useState<FormCondition[]>(initialFormData.conditions);
    const [pricingDefinitions, setPricingDefinitions] = useState<PricingDefinition[]>(initialFormData.pricingDefinitions ?? []);
    const [capacityLimits] = useState(initialFormData.capacityLimits ?? []);
    const [showOptionCounts] = useState(initialFormData.showOptionCounts ?? []);
    const [builderTab, setBuilderTab] = useState<0 | 1 | 2>(0); // 0 = Formulář, 1 = Podmínky, 2 = Ceník
    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [deletionBlock, setDeletionBlock] = useState<{ title: string; message: string; details: string[] } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const allFields = getAllFields(elements);

    const createField = useCallback((type: FieldType, currentElements: FormElement[], pricingId?: string): FormField => {
        const id = crypto.randomUUID();
        const existingFields = getAllFields(currentElements);

        if (type === "heading") {
            return { type: "heading", id, text: "Nový nadpis" } as HeadingField;
        } else if (type === "description") {
            return { type: "description", id, text: "Popisek textu" } as DescriptionField;
        } else {
            const fieldCount = existingFields.filter((f) => f.type !== "heading" && f.type !== "description").length;
            const field: InputField = {
                type,
                id,
                name: `field_${id.substring(0, 8)}`,
                label: `Pole ${fieldCount + 1}`,
                required: false,
                options: type === "select" || type === "radio" ? ["Možnost 1"] : undefined,
            };
            if (type === "pricing_select") {
                field.pricingId = pricingId || "";
            }
            return field;
        }
    }, []);

    const handleAddField = useCallback((type: FieldType) => {
        const newField = createField(type, elementsRef.current);
        setElements((prev) => [...prev, newField]);
        setEditingField(newField);
    }, [createField]);

    const handleAddConditionBlock = useCallback((conditionId: string) => {
        setElements((prev) => {
            const newBlock: ConditionBlock = {
                type: "condition",
                id: crypto.randomUUID(),
                conditionId,
                children: [],
            };
            return [...prev, newBlock];
        });
    }, []);

    const handleAddPricingField = useCallback((definitionId: string) => {
        const def = pricingDefinitions.find((d) => d.id === definitionId);
        const newField = createField("pricing_select", elementsRef.current, definitionId);
        if (def && "label" in newField) {
            (newField as InputField).label = def.name || "Cenový výběr";
        }
        setElements((prev) => [...prev, newField]);
        setEditingField(newField);
    }, [createField, pricingDefinitions]);

    const handleEditField = useCallback((field: FormField) => {
        setEditingField(field);
    }, []);

    const handleSaveField = useCallback((updatedField: FormField) => {
        // Check if saving would break conditions by removing referenced options
        if (editingField && ("options" in updatedField || "pricingId" in updatedField)) {
            const originalOptions = editingField && "options" in editingField
                ? getFieldOptionValues(editingField as InputField, pricingDefinitions)
                : [];
            const newOptions = "options" in updatedField
                ? getFieldOptionValues(updatedField as InputField, pricingDefinitions)
                : [];
            if (originalOptions.length > 0) {
                const broken = getBrokenOptionRemovals(updatedField.id, originalOptions, newOptions, conditions);
                if (broken.length > 0) {
                    setDeletionBlock({
                        title: "Nelze uložit změny",
                        message: "Odebrané možnosti jsou používány v podmínkách:",
                        details: broken.map((b) => `„${b.removedValue}" v podmínce „${b.conditionName}"`),
                    });
                    return;
                }
            }
        }
        setElements((prev) => updateFieldInElements(prev, updatedField));
        setEditingField(null);
    }, [editingField, conditions, pricingDefinitions]);

    const handleDeleteField = useCallback((fieldId: string) => {
        const usages = getConditionsUsingField(fieldId, conditions);
        if (usages.length > 0) {
            setDeletionBlock({
                title: "Nelze smazat pole",
                message: "Pole je používáno v podmínkách:",
                details: usages.map((u) => u.conditionName),
            });
            return;
        }
        setElements((prev) => removeFieldFromElements(prev, fieldId));
    }, [conditions]);

    const handleCreateConditionFromOption = useCallback((fieldId: string, fieldLabel: string, optionValue: string) => {
        const conditionId = crypto.randomUUID();
        const newCondition: FormCondition = {
            id: conditionId,
            name: `${fieldLabel} je ${optionValue}`,
            rules: [{ type: "field_value", fieldId, operator: "equals", value: optionValue }],
        };
        setConditions((prev) => [...prev, newCondition]);

        // Auto-insert a condition block below the source field
        setElements((prev) => {
            const newBlock: ConditionBlock = {
                type: "condition",
                id: crypto.randomUUID(),
                conditionId,
                children: [],
            };

            // Check root-level first
            const rootIndex = prev.findIndex((el) => el.id === fieldId);
            if (rootIndex !== -1) {
                const updated = [...prev];
                updated.splice(rootIndex + 1, 0, newBlock);
                return updated;
            }

            // Field is nested inside a condition block — insert block after the parent
            const parentIndex = prev.findIndex(
                (el) => isConditionBlock(el) && el.children.some((c) => c.id === fieldId)
            );
            if (parentIndex !== -1) {
                const updated = [...prev];
                updated.splice(parentIndex + 1, 0, newBlock);
                return updated;
            }

            // Fallback: append to end
            return [...prev, newBlock];
        });
    }, []);

    const handleToggleField = useCallback((fieldId: string, updates: Partial<InputField>) => {
        setElements((prev) => {
            const field = findFieldById(prev, fieldId);
            if (!field || !isInputField(field)) return prev;
            return updateFieldInElements(prev, { ...field, ...updates });
        });
    }, []);

    const handleDeleteBlock = useCallback((blockId: string) => {
        setElements((prev) => {
            // When deleting a block, move its children to root at the same position
            const idx = prev.findIndex((el) => isConditionBlock(el) && el.id === blockId);
            if (idx === -1) return prev;
            const block = prev[idx] as ConditionBlock;
            const result = [...prev];
            result.splice(idx, 1, ...block.children);
            return result;
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const formData: RegistrationFormData = {
            conditions,
            pricingDefinitions,
            capacityLimits,
            showOptionCounts,
            fields: elements,
        };

        const result = await saveRegistrationForm(yearId, formData);

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
            setElements([]);
            setConditions([]);
            setPricingDefinitions([]);
        }
        setDeleting(false);
    };

    // -- DnD logic --

    // Find which container an item belongs to
    const findContainer = useCallback((itemId: string): string | null => {
        // Check root-level elements
        for (const el of elements) {
            if (isConditionBlock(el)) {
                if (el.id === itemId) return "root";
                if (el.children.some((c) => c.id === itemId)) return el.id;
            } else {
                if (el.id === itemId) return "root";
            }
        }
        return null;
    }, [elements]);

    // Custom collision detection
    const collisionDetection: CollisionDetection = useCallback((args) => {
        // First try pointerWithin to detect containers
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            // Prefer container droppables
            const containerHit = pointerCollisions.find(
                (c) => String(c.id).startsWith("container-") || c.id === "root-droppable"
            );
            if (containerHit) {
                // Also check for sortable items within
                const closestItems = closestCenter(args);
                if (closestItems.length > 0) {
                    return closestItems;
                }
                return [containerHit];
            }
            return pointerCollisions;
        }

        // Fall back to closestCenter
        const closestCenterCollisions = closestCenter(args);
        if (closestCenterCollisions.length > 0) {
            return closestCenterCollisions;
        }

        return rectIntersection(args);
    }, []);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        // Don't process palette items during over
        if (activeIdStr.startsWith("palette-")) return;

        // Find containers
        const activeContainer = findContainer(activeIdStr);
        let overContainer: string | null = null;

        if (overIdStr.startsWith("container-")) {
            // Dropping directly on a container
            overContainer = overIdStr.replace("container-", "");
        } else if (overIdStr === "root-droppable") {
            overContainer = "root";
        } else {
            overContainer = findContainer(overIdStr);
        }

        if (!activeContainer || !overContainer) return;
        if (activeContainer === overContainer) return;

        // Move between containers
        setElements((prev) => {
            // Extract the field from its current container
            const field = findFieldById(prev, activeIdStr);
            if (!field || isConditionBlock(field as FormElement)) return prev;

            let updated = removeFieldFromElements(prev, activeIdStr);

            // Add to new container
            if (overContainer === "root") {
                // Add at root level
                const overIndex = updated.findIndex((el) => {
                    if (isConditionBlock(el)) return el.id === overIdStr;
                    return el.id === overIdStr;
                });
                if (overIndex !== -1) {
                    updated.splice(overIndex + 1, 0, field);
                } else {
                    updated.push(field);
                }
            } else {
                // Add into a condition block
                updated = updated.map((el) => {
                    if (isConditionBlock(el) && el.id === overContainer) {
                        const overChildIdx = el.children.findIndex((c) => c.id === overIdStr);
                        const children = [...el.children];
                        if (overChildIdx !== -1) {
                            children.splice(overChildIdx + 1, 0, field);
                        } else {
                            children.push(field);
                        }
                        return { ...el, children };
                    }
                    return el;
                });
            }

            return updated;
        });
    }, [findContainer]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        const activeIdStr = String(active.id);

        // -- Palette condition drop: create new condition block
        if (activeIdStr.startsWith("palette-condition-")) {
            const conditionId = activeIdStr.replace("palette-condition-", "");

            setElements((prev) => {
                const newBlock: ConditionBlock = {
                    type: "condition",
                    id: crypto.randomUUID(),
                    conditionId,
                    children: [],
                };

                if (over) {
                    const overIdStr = String(over.id);
                    // Find root-level insert position
                    const overIndex = prev.findIndex((el) => {
                        if (isConditionBlock(el)) return el.id === overIdStr;
                        return el.id === overIdStr;
                    });

                    if (overIndex !== -1) {
                        const updated = [...prev];
                        updated.splice(overIndex + 1, 0, newBlock);
                        return updated;
                    }
                }

                return [...prev, newBlock];
            });
            return;
        }

        // -- Palette pricing drop: create new pricing_select field
        if (activeIdStr.startsWith("palette-pricing-")) {
            const definitionId = activeIdStr.replace("palette-pricing-", "");
            const def = pricingDefinitions.find((d) => d.id === definitionId);
            const newField = createField("pricing_select", elementsRef.current, definitionId);
            if (def && "label" in newField) {
                (newField as InputField).label = def.name || "Cenový výběr";
            }

            setElements((prev) => {
                if (over) {
                    const overIdStr = String(over.id);

                    if (overIdStr.startsWith("container-")) {
                        const blockId = overIdStr.replace("container-", "");
                        return prev.map((el) => {
                            if (isConditionBlock(el) && el.id === blockId) {
                                return { ...el, children: [...el.children, newField] };
                            }
                            return el;
                        });
                    }

                    const parentBlock = prev.find(
                        (el) => isConditionBlock(el) && el.children.some((c) => c.id === overIdStr)
                    );
                    if (parentBlock && isConditionBlock(parentBlock)) {
                        return prev.map((el) => {
                            if (isConditionBlock(el) && el.id === parentBlock.id) {
                                const childIdx = el.children.findIndex((c) => c.id === overIdStr);
                                const children = [...el.children];
                                children.splice(childIdx + 1, 0, newField);
                                return { ...el, children };
                            }
                            return el;
                        });
                    }

                    const overIndex = prev.findIndex((el) => {
                        if (isConditionBlock(el)) return el.id === overIdStr;
                        return el.id === overIdStr;
                    });

                    if (overIndex !== -1) {
                        const updated = [...prev];
                        updated.splice(overIndex + 1, 0, newField);
                        return updated;
                    }
                }

                return [...prev, newField];
            });
            setEditingField(newField);
            return;
        }

        // -- Palette field drop: create new field
        if (activeIdStr.startsWith("palette-")) {
            const type = activeIdStr.replace("palette-", "") as FieldType;
            const newField = createField(type, elementsRef.current);

            setElements((prev) => {
                if (over) {
                    const overIdStr = String(over.id);

                    // Check if dropping into a container
                    if (overIdStr.startsWith("container-")) {
                        const blockId = overIdStr.replace("container-", "");
                        return prev.map((el) => {
                            if (isConditionBlock(el) && el.id === blockId) {
                                return { ...el, children: [...el.children, newField] };
                            }
                            return el;
                        });
                    }

                    // Check if over target is inside a condition block
                    const parentBlock = prev.find(
                        (el) => isConditionBlock(el) && el.children.some((c) => c.id === overIdStr)
                    );
                    if (parentBlock && isConditionBlock(parentBlock)) {
                        return prev.map((el) => {
                            if (isConditionBlock(el) && el.id === parentBlock.id) {
                                const childIdx = el.children.findIndex((c) => c.id === overIdStr);
                                const children = [...el.children];
                                children.splice(childIdx + 1, 0, newField);
                                return { ...el, children };
                            }
                            return el;
                        });
                    }

                    // Root level insert
                    const overIndex = prev.findIndex((el) => {
                        if (isConditionBlock(el)) return el.id === overIdStr;
                        return el.id === overIdStr;
                    });

                    if (overIndex !== -1) {
                        const updated = [...prev];
                        updated.splice(overIndex + 1, 0, newField);
                        return updated;
                    }
                }

                // Append to end
                return [...prev, newField];
            });
            setEditingField(newField);
            return;
        }

        // -- Internal reorder (same container)
        if (over && active.id !== over.id) {
            const overIdStr = String(over.id);

            setElements((prev) => {
                const activeContainer = findContainerInElements(prev, activeIdStr);
                const overContainer = findContainerForOver(prev, overIdStr);

                if (!activeContainer || !overContainer) return prev;
                if (activeContainer !== overContainer) return prev; // cross-container handled in onDragOver

                if (activeContainer === "root") {
                    const oldIndex = prev.findIndex((el) => {
                        if (isConditionBlock(el)) return el.id === activeIdStr;
                        return el.id === activeIdStr;
                    });
                    const newIndex = prev.findIndex((el) => {
                        if (isConditionBlock(el)) return el.id === overIdStr;
                        return el.id === overIdStr;
                    });
                    if (oldIndex === -1 || newIndex === -1) return prev;
                    return arrayMove(prev, oldIndex, newIndex);
                } else {
                    // Reorder within a condition block
                    return prev.map((el) => {
                        if (isConditionBlock(el) && el.id === activeContainer) {
                            const oldIndex = el.children.findIndex((c) => c.id === activeIdStr);
                            const newIndex = el.children.findIndex((c) => c.id === overIdStr);
                            if (oldIndex === -1 || newIndex === -1) return el;
                            return { ...el, children: arrayMove(el.children, oldIndex, newIndex) };
                        }
                        return el;
                    });
                }
            });
        }
    }, [createField, pricingDefinitions]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    // Render the drag overlay content
    const renderDragOverlay = () => {
        if (!activeId) return null;

        if (activeId.startsWith("palette-pricing-")) {
            const definitionId = activeId.replace("palette-pricing-", "");
            const def = pricingDefinitions.find((d) => d.id === definitionId);
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
                        borderColor: "success.main",
                        width: 200,
                    }}
                >
                    <Box sx={{ color: "success.main", display: "flex" }}>
                        {FIELD_TYPE_ICONS["Sell"]}
                    </Box>
                    <Typography variant="body2">{def?.name || "Ceník"}</Typography>
                </Paper>
            );
        }

        if (activeId.startsWith("palette-condition-")) {
            const conditionId = activeId.replace("palette-condition-", "");
            const condition = conditions.find((c) => c.id === conditionId);
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
                        borderColor: "info.main",
                        width: 200,
                    }}
                >
                    <Box sx={{ color: "info.main", display: "flex" }}>
                        {FIELD_TYPE_ICONS["AccountTree"]}
                    </Box>
                    <Typography variant="body2">{condition?.name || "Podmínka"}</Typography>
                </Paper>
            );
        }

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
        const field = findFieldById(elements, activeId);
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

        // Condition block overlay
        const block = elements.find((el) => isConditionBlock(el) && el.id === activeId);
        if (block && isConditionBlock(block)) {
            const condition = conditions.find((c) => c.id === block.conditionId);
            return (
                <Paper elevation={4} sx={{ p: 1.5, borderLeft: "4px solid", borderLeftColor: "info.main" }}>
                    <Typography variant="body2" fontWeight={500}>
                        Podmínka: {condition?.name || "(nepojmenovaná)"}
                    </Typography>
                </Paper>
            );
        }

        return null;
    };

    const hasElements = elements.length > 0 || initialFormData.fields.length > 0;

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

            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                    borderRadius: 2,
                }}
            >
                <TuneOutlined color="primary" />
                <Typography variant="h6" sx={{ flex: 1 }}>
                    Registrační formulář
                </Typography>

                <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => {
                        const formData: RegistrationFormData = {
                            conditions,
                            pricingDefinitions,
                            capacityLimits,
                            showOptionCounts,
                            fields: elements,
                        };
                        localStorage.setItem("form-preview-data", JSON.stringify(formData));
                        window.open(`/admin/rocniky/${yearId}/registrace/nahled`, "_blank");
                    }}
                    disabled={elements.length === 0}
                >
                    Náhled
                </Button>

                <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving || (elements.length === 0 && conditions.length === 0)}
                >
                    {saving ? "Ukládám..." : "Uložit formulář"}
                </Button>
            </Paper>

            <Tabs
                value={builderTab}
                onChange={(_e, v) => setBuilderTab(v)}
                sx={{
                    mb: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Tab label="Formulář" />
                <Tab label="Podmínky" />
                <Tab label="Ceník" />
            </Tabs>

            {builderTab === 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={collisionDetection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <Box sx={{ display: "flex", gap: 3 }}>
                        {/* Left column: element list */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <FormDropZone
                                elements={elements}
                                conditions={conditions}
                                pricingDefinitions={pricingDefinitions}
                                onEditField={handleEditField}
                                onDeleteField={handleDeleteField}
                                onDeleteBlock={handleDeleteBlock}
                                onToggleField={handleToggleField}
                                onCreateCondition={handleCreateConditionFromOption}
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
                                {hasElements && (
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
                                <FieldPalette
                                    conditions={conditions}
                                    pricingDefinitions={pricingDefinitions}
                                    onAddField={handleAddField}
                                    onAddConditionBlock={handleAddConditionBlock}
                                    onAddPricingField={handleAddPricingField}
                                />
                            </Box>
                        )}
                    </Box>

                    <DragOverlay dropAnimation={null}>
                        {renderDragOverlay()}
                    </DragOverlay>
                </DndContext>
            )}

            {builderTab === 1 && (
                <ConditionEditor
                    conditions={conditions}
                    allFields={allFields}
                    elements={elements}
                    onChange={setConditions}
                    pricingDefinitions={pricingDefinitions}
                />
            )}

            {builderTab === 2 && (
                <PricingEditor
                    pricingDefinitions={pricingDefinitions}
                    elements={elements}
                    onChange={setPricingDefinitions}
                />
            )}

            <FieldTypeSelector
                open={typeSelectorOpen}
                onClose={() => setTypeSelectorOpen(false)}
                onSelect={handleAddField}
            />

            <FieldEditor
                open={!!editingField}
                field={editingField}
                onClose={() => setEditingField(null)}
                onSave={handleSaveField}
                conditions={conditions}
                pricingDefinitions={pricingDefinitions}
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

            <Dialog open={!!deletionBlock} onClose={() => setDeletionBlock(null)}>
                <DialogTitle>{deletionBlock?.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{deletionBlock?.message}</DialogContentText>
                    {deletionBlock?.details && (
                        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                            {deletionBlock.details.map((detail, idx) => (
                                <li key={idx}>
                                    <Typography variant="body2">{detail}</Typography>
                                </li>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeletionBlock(null)} variant="contained">
                        Rozumím
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// -- Drop zone component for the form elements --

interface FormDropZoneProps {
    elements: FormElement[];
    conditions: FormCondition[];
    pricingDefinitions?: PricingDefinition[];
    onEditField: (field: FormField) => void;
    onDeleteField: (fieldId: string) => void;
    onDeleteBlock: (blockId: string) => void;
    onToggleField?: (fieldId: string, updates: Partial<InputField>) => void;
    onCreateCondition?: (fieldId: string, fieldLabel: string, optionValue: string) => void;
}

function FormDropZone({ elements, conditions, pricingDefinitions, onEditField, onDeleteField, onDeleteBlock, onToggleField, onCreateCondition }: FormDropZoneProps) {
    const usedFieldIds = getFieldIdsUsedInConditions(conditions);

    const { setNodeRef, isOver } = useDroppable({
        id: "root-droppable",
    });

    // Build sortable IDs for root level (both fields and condition blocks)
    const rootIds = elements.map((el) => {
        if (isConditionBlock(el)) return el.id;
        return el.id;
    });

    return (
        <SortableContext
            items={rootIds}
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
                    p: elements.length === 0 ? 0 : 0.5,
                }}
            >
                {elements.length === 0 ? (
                    <Typography
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 4 }}
                    >
                        Formulář je prázdný. Přetáhněte pole z palety nebo použijte tlačítko.
                    </Typography>
                ) : (
                    elements.map((el) => {
                        if (isConditionBlock(el)) {
                            const condition = conditions.find((c) => c.id === el.conditionId);
                            return (
                                <SortableFieldItem key={el.id} id={el.id}>
                                    <ConditionBlockItem
                                        block={el}
                                        condition={condition}
                                        onEditField={onEditField}
                                        onDeleteField={onDeleteField}
                                        onDeleteBlock={onDeleteBlock}
                                        onToggleField={onToggleField}
                                        usedFieldIds={usedFieldIds}
                                        pricingDefinitions={pricingDefinitions}
                                        onCreateCondition={onCreateCondition}
                                    />
                                </SortableFieldItem>
                            );
                        }

                        return (
                            <SortableFieldItem key={el.id} id={el.id}>
                                <FieldListItem
                                    field={el}
                                    onEdit={() => onEditField(el)}
                                    onDelete={() => onDeleteField(el.id)}
                                    onToggleField={onToggleField}
                                    usedInCondition={usedFieldIds.has(el.id)}
                                    pricingDefinitions={pricingDefinitions}
                                    onCreateCondition={onCreateCondition}
                                />
                            </SortableFieldItem>
                        );
                    })
                )}
            </Box>
        </SortableContext>
    );
}

// -- Helper functions --

function findFieldById(elements: FormElement[], fieldId: string): FormField | null {
    for (const el of elements) {
        if (isConditionBlock(el)) {
            const child = el.children.find((c) => c.id === fieldId);
            if (child) return child;
        } else if (el.id === fieldId) {
            return el;
        }
    }
    return null;
}

function updateFieldInElements(elements: FormElement[], updatedField: FormField): FormElement[] {
    return elements.map((el) => {
        if (isConditionBlock(el)) {
            return {
                ...el,
                children: el.children.map((c) => (c.id === updatedField.id ? updatedField : c)),
            };
        }
        return el.id === updatedField.id ? updatedField : el;
    });
}

function removeFieldFromElements(elements: FormElement[], fieldId: string): FormElement[] {
    const result: FormElement[] = [];
    for (const el of elements) {
        if (isConditionBlock(el)) {
            const filteredChildren = el.children.filter((c) => c.id !== fieldId);
            result.push({ ...el, children: filteredChildren });
        } else if (el.id !== fieldId) {
            result.push(el);
        }
    }
    return result;
}

function findContainerInElements(elements: FormElement[], itemId: string): string | null {
    for (const el of elements) {
        if (isConditionBlock(el)) {
            if (el.id === itemId) return "root";
            if (el.children.some((c) => c.id === itemId)) return el.id;
        } else {
            if (el.id === itemId) return "root";
        }
    }
    return null;
}

function findContainerForOver(elements: FormElement[], overId: string): string | null {
    if (overId === "root-droppable") return "root";
    if (overId.startsWith("container-")) return overId.replace("container-", "");
    return findContainerInElements(elements, overId);
}
