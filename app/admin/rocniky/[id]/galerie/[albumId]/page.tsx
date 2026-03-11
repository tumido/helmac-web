import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { ImageGrid } from "@/components/admin/image-grid";
import { PageHeader } from "@/components/admin/page-header";
import { AlbumImageDropzone } from "@/components/admin/album-image-dropzone";

interface YearEditAlbumPageProps {
    params: Promise<{ id: string; albumId: string }>;
}

async function getAlbum(albumId: string) {
    return db.album.findUnique({
        where: { id: albumId },
        include: {
            year: {
                select: { id: true, year: true, title: true },
            },
            images: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });
}

export default async function YearEditAlbumPage({ params }: YearEditAlbumPageProps) {
    const { id, albumId } = await params;
    const album = await getAlbum(albumId);

    if (!album || album.yearId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${album.year.year} - ${album.year.title}`, href: `/admin/rocniky/${id}` },
                    { label: "Galerie", href: `/admin/rocniky/${id}/galerie` },
                    { label: album.title },
                ]}
                title="Upravit album"
            />
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Button
                        href={`/galerie/${album.year.year}/${album.slug}`}
                        target="_blank"
                        variant="outlined"
                        startIcon={<OpenInNew />}
                    >
                        Nahled
                    </Button>
                </Box>
                <Typography color="text.secondary">
                    {album.year.year} - {album.title}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1.5fr" },
                    gap: 4,
                }}
            >
                {/* Album Settings */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Nastaveni alba
                    </Typography>
                    <AlbumForm
                        mode="edit"
                        years={[album.year]}
                        albumId={album.id}
                        defaultValues={{
                            yearId: album.yearId,
                            title: album.title,
                            description: album.description,
                            coverImage: album.coverImage,
                        }}
                        cancelHref={`/admin/rocniky/${id}/galerie`}
                    />
                </Box>

                {/* Images */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Obrazky ({album.images.length})
                    </Typography>

                    <AlbumImageDropzone albumId={album.id} />

                    {album.images.length === 0 ? (
                        <Card>
                            <CardContent>
                                <Typography
                                    color="text.secondary"
                                    textAlign="center"
                                >
                                    Album neobsahuje zadne obrazky.
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <ImageGrid
                            images={album.images}
                            albumId={album.id}
                            basePath={`/admin/rocniky/${id}/galerie/${album.id}`}
                        />
                    )}
                </Box>
            </Box>
        </Container>
    );
}
