import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Button, Typography, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { PageHeader } from "@/components/public/ui";
import { ImageLightbox } from "@/components/public/features/gallery/ImageLightbox";
import { getAlbumBySlugForActiveYear } from "@/lib/services";

interface AlbumDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AlbumDetailPageProps) {
    const { slug } = await params;
    const album = await getAlbumBySlugForActiveYear(slug);

    if (!album) {
        return { title: "Album nenalezeno | Helmac" };
    }

    return {
        title: `${album.title} | Galerie | Helmac`,
        description: album.description || undefined,
    };
}

export default async function AlbumDetailPage({
    params,
}: AlbumDetailPageProps) {
    const { slug } = await params;
    const album = await getAlbumBySlugForActiveYear(slug);

    if (!album) {
        notFound();
    }

    return (
        <>
            <PageHeader title={album.title} subtitle={album.description || undefined} />

            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <Button
                    component={Link}
                    href="/galerie"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 4 }}
                >
                    Zpet na galerii
                </Button>

                {album.images.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography color="text.secondary">
                            Album zatim neobsahuje zadne fotografie
                        </Typography>
                    </Box>
                ) : (
                    <ImageLightbox images={album.images} />
                )}
            </Container>
        </>
    );
}
