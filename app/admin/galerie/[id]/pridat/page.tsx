import { Container, Typography, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ImageForm } from "@/components/forms/image-form";

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
            <Box sx={{ mb: 4 }}>
                <LinkButton
                    href={`/admin/galerie/${album.id}`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na album
                </LinkButton>
                <Typography variant="h4">Pridat obrazek</Typography>
                <Typography color="text.secondary">{album.title}</Typography>
            </Box>

            <ImageForm mode="create" albumId={album.id} />
        </Container>
    );
}
