import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ListFilters } from "@/components/admin/list-filters";
import { AlbumList } from "@/components/admin/album-list";
import { Prisma } from "@prisma/client";

interface GalleryPageProps {
    searchParams: Promise<{ q?: string; yearId?: string }>;
}

async function getAlbums(filters: { q?: string; yearId?: string }) {
    const where: Prisma.AlbumWhereInput = {};

    if (filters.q) {
        where.OR = [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
        ];
    }

    if (filters.yearId) {
        where.yearId = filters.yearId;
    }

    return db.album.findMany({
        where,
        orderBy: [{ year: { year: "desc" } }, { sortOrder: "asc" }],
        include: {
            year: {
                select: { year: true, title: true },
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

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
    const params = await searchParams;
    const [albums, years] = await Promise.all([getAlbums(params), getYears()]);

    return (
        <Container maxWidth="lg">
            <PageHeader breadcrumbs={[{ label: "Galerie" }]} title="Galerie" />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                {years.length > 0 && (
                    <LinkButton
                        href="/admin/galerie/nove"
                        variant="contained"
                        startIcon={<Add />}
                    >
                        Nové album
                    </LinkButton>
                )}
            </Box>

            {years.length > 0 && (
                <ListFilters
                    showYearFilter
                    years={years}
                    searchPlaceholder="Hledat alba..."
                />
            )}

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Nejprve vytvořte ročník pro přidávání alb.
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <LinkButton
                                href="/admin/rocniky/novy"
                                variant="outlined"
                            >
                                Vytvořit ročník
                            </LinkButton>
                        </Box>
                    </CardContent>
                </Card>
            ) : albums.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            {params.q || params.yearId
                                ? "Žádná alba neodpovídají filtru."
                                : "Zatím nebyla vytvořena žádná alba."}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <AlbumList albums={albums} />
            )}
        </Container>
    );
}
