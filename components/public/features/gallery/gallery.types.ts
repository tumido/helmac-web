export interface AlbumPreview {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    year: {
        year: number;
    };
    _count: {
        images: number;
    };
}

export interface AlbumImage {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    description: string | null;
    altText: string | null;
    width: number | null;
    height: number | null;
}

export interface AlbumDetail {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    year: {
        year: number;
    };
    images: AlbumImage[];
}
