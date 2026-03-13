import {
    Container,
    Typography,
    Box,
} from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { PageHeader } from "@/components/admin/page-header";

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
        <Container maxWidth="md">
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
                <Typography color="text.secondary">
                    {album.year.year} - {album.title}
                </Typography>
            </Box>

            <AlbumForm
                mode="edit"
                years={[album.year]}
                albumId={album.id}
                defaultValues={{
                    yearId: album.yearId,
                    title: album.title,
                    description: album.description,
                    coverImage: album.coverImage,
                    externalUrl: album.externalUrl,
                }}
                cancelHref={`/admin/rocniky/${id}/galerie`}
            />
        </Container>
    );
}
