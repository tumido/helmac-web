export interface AlbumPreview {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    externalUrl: string;
    year: {
        year: number;
    };
}
