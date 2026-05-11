import type { ContentBlock } from "@/lib/types/content-blocks";

export interface OfferItem {
    id: string;
    title: string;
    subtitle: string | null;
    icon: string | null;
    content: ContentBlock[];
    showToc: boolean;
    sortOrder: number;
}
