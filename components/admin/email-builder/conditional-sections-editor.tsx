"use client";

import { Box, Card, CardContent, IconButton, Tooltip, Typography } from "@mui/material";
import { Add, Delete, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import type { FormField, FormElement, PricingDefinition } from "@/lib/types/registration-form";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SingleConditionEditor } from "./single-condition-editor";

interface ConditionalSectionsEditorProps {
    sections: EmailConditionalSection[];
    onChange: (sections: EmailConditionalSection[]) => void;
    availableFields: FormField[];
    formElements?: FormElement[];
    pricingDefinitions?: PricingDefinition[];
    placeholders: { key: string; label: string }[];
}

export function ConditionalSectionsEditor({
    sections,
    onChange,
    availableFields,
    formElements,
    pricingDefinitions,
    placeholders,
}: ConditionalSectionsEditorProps) {
    const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

    const updateSection = (id: string, updates: Partial<EmailConditionalSection>) => {
        onChange(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };

    const deleteSection = (id: string) => {
        const remaining = sections
            .filter((s) => s.id !== id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((s, i) => ({ ...s, sortOrder: i }));
        onChange(remaining);
    };

    const addSection = () => {
        const newSection: EmailConditionalSection = {
            id: crypto.randomUUID(),
            condition: {
                id: crypto.randomUUID(),
                name: "",
                rules: [{ type: "field_value", fieldId: "", operator: "equals", value: "" }],
            },
            body: "",
            sortOrder: sortedSections.length,
        };
        onChange([...sections, newSection]);
    };

    const moveSection = (id: string, direction: -1 | 1) => {
        const idx = sortedSections.findIndex((s) => s.id === id);
        const target = idx + direction;
        if (idx < 0 || target < 0 || target >= sortedSections.length) return;
        const reordered = [...sortedSections];
        [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
        onChange(reordered.map((s, i) => ({ ...s, sortOrder: i })));
    };

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                Podmíněné sekce
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Text v každé sekci se připojí na konec emailu, pouze pokud podmínka platí pro danou registraci.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {sortedSections.map((section, idx) => (
                    <Card key={section.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 2,
                                py: 1.5,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                                Sekce {idx + 1}
                            </Typography>
                            <Tooltip title="Posunout nahoru">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => moveSection(section.id, -1)}
                                        disabled={idx === 0}
                                    >
                                        <ArrowUpward fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Posunout dolů">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => moveSection(section.id, 1)}
                                        disabled={idx === sortedSections.length - 1}
                                    >
                                        <ArrowDownward fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Smazat sekci">
                                <IconButton size="small" color="error" onClick={() => deleteSection(section.id)}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <CardContent>
                            <SingleConditionEditor
                                condition={section.condition}
                                allFields={availableFields}
                                elements={formElements}
                                pricingDefinitions={pricingDefinitions}
                                onChange={(condition) => updateSection(section.id, { condition })}
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                                Text sekce
                            </Typography>
                            <RichTextEditor
                                value={section.body}
                                onChange={(value) => updateSection(section.id, { body: value })}
                                format="html"
                                minHeight={140}
                                placeholder="Zadejte text, který se odešle pokud podmínka platí..."
                                placeholders={placeholders}
                            />
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Box
                onClick={addSection}
                sx={{
                    mt: 2,
                    p: 2.5,
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                    },
                }}
            >
                <Add color="action" />
                <Typography variant="body2" color="text.secondary">
                    Přidat podmíněnou sekci
                </Typography>
            </Box>

        </Box>
    );
}
