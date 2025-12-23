export interface NewsItem {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    author: {
        name: string;
    };
}

export interface NewsDetail extends NewsItem {
    content: string;
}
