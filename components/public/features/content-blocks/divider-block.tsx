import { DecorativeDivider } from "@/components/public/ui/Divider";
import type { DividerBlock } from "@/lib/types/content-blocks";

interface DividerBlockRendererProps {
    block: DividerBlock;
}

export function DividerBlockRenderer({ block }: DividerBlockRendererProps) {
    return <DecorativeDivider variant={block.variant} />;
}
