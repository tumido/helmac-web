import type { ContentBlock } from "@/lib/types/content-blocks";

export interface SectionItem {
    id: string;
    title: string;
    subtitle: string | null;
    icon: string | null;
    content: ContentBlock[];
    showToc: boolean;
    sortOrder: number;
}
