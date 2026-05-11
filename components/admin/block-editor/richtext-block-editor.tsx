"use client";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { RichTextBlock } from "@/lib/types/content-blocks";

interface RichTextBlockEditorProps {
    block: RichTextBlock;
    onChange: (block: RichTextBlock) => void;
    yearId?: string;
}

export function RichTextBlockEditor({
    block,
    onChange,
    yearId,
}: RichTextBlockEditorProps) {
    return (
        <RichTextEditor
            value={block.content}
            onChange={(content) => onChange({ ...block, content })}
            minHeight={80}
            yearId={yearId}
        />
    );
}
