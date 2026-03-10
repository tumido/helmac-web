import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ImageForm } from "@/components/forms/image-form";
import { PageHeader } from "@/components/admin/page-header";

interface AddImagePageProps {
    params: Promise<{ id: string }>;
}

async function getAlbum(id: string) {
    return db.album.findUnique({
        where: { id },
        select: { id: true, title: true },
    });
}

export default async function AddImagePage({ params }: AddImagePageProps) {
    const { id } = await params;
    const album = await getAlbum(id);

    if (!album) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Galerie", href: "/admin/galerie" },
                    { label: album.title, href: `/admin/galerie/${album.id}` },
                    { label: "Pridat obrazek" },
                ]}
                title="Pridat obrazek"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">{album.title}</Typography>
            </Box>

            <ImageForm mode="create" albumId={album.id} />
        </Container>
    );
}
