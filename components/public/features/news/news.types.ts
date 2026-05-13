export interface NewsActionButton {
    label: string;
    url: string;
    variant?: "contained" | "outlined";
}

export interface NewsItem {
    id: string;
    slug: string;
    title: string;
    content: string;
    actionButtons: NewsActionButton[];
    publishedAt: Date | null;
}
