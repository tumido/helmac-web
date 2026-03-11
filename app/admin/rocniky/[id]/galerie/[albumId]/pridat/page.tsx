import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ImageForm } from "@/components/forms/image-form";
import { PageHeader } from "@/components/admin/page-header";

interface YearAddImagePageProps {
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

export default async function YearAddImagePage({ params }: YearAddImagePageProps) {
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
                    { label: album.title, href: `/admin/rocniky/${id}/galerie/${album.id}` },
                    { label: "Přidat obrázek" },
                ]}
                title="Přidat obrázek"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">{album.title}</Typography>
            </Box>

            <ImageForm
                mode="create"
                albumId={album.id}
                cancelHref={`/admin/rocniky/${id}/galerie/${album.id}`}
            />
        </Container>
    );
}
