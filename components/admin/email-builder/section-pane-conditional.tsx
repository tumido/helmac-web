"use client";

import { useRef } from "react";
import { Box } from "@mui/material";
import { RichTextEditor, type Editor } from "@/components/admin/rich-text-editor";
import { SingleConditionEditor } from "./single-condition-editor";
import { PanelLabel } from "./panel-label";
import { PlaceholderStrip } from "./placeholder-strip";
import type { FormField, PricingDefinition } from "@/lib/types/registration-form";
import type { EmailConditionalSection } from "@/lib/types/email-sections";

interface SectionPaneConditionalProps {
    section: EmailConditionalSection;
    allFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
    placeholders: { key: string; label: string }[];
    onChange: (next: EmailConditionalSection) => void;
}

const toEditorHtml = (text: string) => {
    if (!text || text.includes("<")) return text;
    return text.replace(/\n/g, "<br>");
};

export function SectionPaneConditional({
    section,
    allFields,
    pricingDefinitions,
    placeholders,
    onChange,
}: SectionPaneConditionalProps) {
    const editorRef = useRef<Editor | null>(null);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
                <PanelLabel>Podmínka</PanelLabel>
                <SingleConditionEditor
                    condition={section.condition}
                    allFields={allFields}
                    pricingDefinitions={pricingDefinitions}
                    onChange={(condition) => onChange({ ...section, condition })}
                />
            </Box>

            <Box>
                <PanelLabel>Text sekce</PanelLabel>
                <RichTextEditor
                    value={toEditorHtml(section.body)}
                    onChange={(value) => onChange({ ...section, body: value })}
                    format="html"
                    editorRef={editorRef}
                    minHeight={180}
                    placeholder="Zadejte text, který se odešle pokud podmínka platí..."
                    placeholders={placeholders}
                />
                <PlaceholderStrip
                    placeholders={placeholders}
                    editorRef={editorRef}
                    onFallbackInsert={(key) =>
                        onChange({ ...section, body: section.body + `{${key}}` })
                    }
                />
            </Box>
        </Box>
    );
}
