import { Box } from "@mui/material";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { RichTextBlock } from "@/lib/types/content-blocks";

interface RichTextBlockRendererProps {
    block: RichTextBlock;
    tocIds?: Map<string, string>;
}

export function RichTextBlockRenderer({
    block,
    tocIds,
}: RichTextBlockRendererProps) {
    return (
        <Box sx={{ px: 2 }}>
            <MarkdownContent content={block.content} tocIds={tocIds} />
        </Box>
    );
}
