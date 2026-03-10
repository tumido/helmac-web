import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
} from "@mui/material";
import {
    Add,
    OpenInNew,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { ImageGrid } from "@/components/admin/image-grid";
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
            images: {
                orderBy: { sortOrder: "asc" },
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
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Galerie", href: "/admin/galerie" },
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
                        years={years}
                        albumId={album.id}
                        defaultValues={{
                            yearId: album.yearId,
                            slug: album.slug,
                            title: album.title,
                            description: album.description,
                            coverImage: album.coverImage,
                        }}
                    />
                </Box>

                {/* Images */}
                <Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">
                            Obrazky ({album.images.length})
                        </Typography>
                        <LinkButton
                            href={`/admin/galerie/${album.id}/pridat`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Pridat obrazek
                        </LinkButton>
                    </Box>

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
                        <ImageGrid images={album.images} albumId={album.id} />
                    )}
                </Box>
            </Box>
        </Container>
    );
}
