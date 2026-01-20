import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ImageForm } from "@/components/forms/image-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

interface EditImagePageProps {
    params: Promise<{ id: string; imageId: string }>;
}

async function getImage(imageId: string) {
    return db.image.findUnique({
        where: { id: imageId },
        include: {
            album: {
                select: { id: true, title: true },
            },
        },
    });
}

export default async function EditImagePage({ params }: EditImagePageProps) {
    const { id, imageId } = await params;
    const image = await getImage(imageId);

    if (!image || image.albumId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Galerie", href: "/admin/galerie" },
                    { label: image.album.title, href: `/admin/galerie/${image.album.id}` },
                    { label: image.title || "Obrazek" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4">Upravit obrazek</Typography>
                <Typography color="text.secondary">
                    {image.album.title}
                </Typography>
            </Box>

            {image.url && (
                <Box sx={{ mb: 3, maxWidth: 400 }}>
                    <Box
                        component="img"
                        src={image.thumbnailUrl || image.url}
                        alt={image.altText || image.title || ""}
                        sx={{
                            width: "100%",
                            height: "auto",
                            borderRadius: 1,
                        }}
                    />
                </Box>
            )}

            <ImageForm
                mode="edit"
                albumId={image.album.id}
                imageId={image.id}
                defaultValues={{
                    url: image.url,
                    thumbnailUrl: image.thumbnailUrl,
                    title: image.title,
                    description: image.description,
                    altText: image.altText,
                }}
            />
        </Container>
    );
}
