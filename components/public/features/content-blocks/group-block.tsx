"use client";

import type { GroupBlock } from "@/lib/types/content-blocks";
import type { RegistrationStats } from "@/lib/services/registration";
import { BlockRenderer } from "./block-renderer";

interface GroupBlockRendererProps {
    block: GroupBlock;
    tocIds?: Map<string, string>;
    stats?: Record<string, RegistrationStats>;
}

export function GroupBlockRenderer({
    block,
    tocIds,
    stats,
}: GroupBlockRendererProps) {
    return (
        <BlockRenderer
            blocks={block.children}
            tocIds={tocIds}
            stats={stats}
        />
    );
}
