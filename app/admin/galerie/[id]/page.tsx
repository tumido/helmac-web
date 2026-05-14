import {
    Container,
    Typography,
    Box,
} from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { PageHeader } from "@/components/admin/page-header";

interface EditAlbumPageProps {
    params: Promise<{ id: string }>;
}

async function getAlbum(id: string) {
    return db.album.findUnique({
        where: { id },
        include: {
            year: {
                select: { id: true, year: true, title: true },
            },
        },
    });
}

async function getYears() {
    return db.year.findMany({
        where: { isArchived: false },
        orderBy: { year: "desc" },
        select: { id: true, year: true, title: true },
    });
}

export default async function EditAlbumPage({ params }: EditAlbumPageProps) {
    const { id } = await params;
    const [album, years] = await Promise.all([getAlbum(id), getYears()]);

    if (!album) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Galerie", href: "/admin/galerie" },
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
                years={years}
                albumId={album.id}
                defaultValues={{
                    yearId: album.yearId,
                    title: album.title,
                    description: album.description,
                    coverImage: album.coverImage,
                    ogImageUrl: album.ogImageUrl,
                    externalUrl: album.externalUrl,
                }}
            />
        </Container>
    );
}
