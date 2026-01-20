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
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { ListFilters } from "@/components/admin/list-filters";
import { SelectableAlbumList } from "@/components/admin/selectable-album-list";
import { Prisma } from "@prisma/client";

interface GalleryPageProps {
    searchParams: Promise<{ q?: string; yearId?: string; status?: string }>;
}

async function getAlbums(filters: { q?: string; yearId?: string; status?: string }) {
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

    if (filters.status === "published") {
        where.isPublished = true;
    } else if (filters.status === "draft") {
        where.isPublished = false;
    }

    return db.album.findMany({
        where,
        orderBy: [{ year: { year: "desc" } }, { sortOrder: "asc" }],
        include: {
            year: {
                select: { year: true, title: true },
            },
            _count: {
                select: { images: true },
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
            <AdminBreadcrumbs items={[{ label: "Galerie" }]} />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <Typography variant="h4">Galerie</Typography>
                {years.length > 0 && (
                    <LinkButton
                        href="/admin/galerie/nove"
                        variant="contained"
                        startIcon={<Add />}
                    >
                        Nove album
                    </LinkButton>
                )}
            </Box>

            {years.length > 0 && (
                <ListFilters
                    showYearFilter
                    showStatusFilter
                    years={years}
                    searchPlaceholder="Hledat alba..."
                />
            )}

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Nejprve vytvorte rocnik pro pridavani alb.
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <LinkButton
                                href="/admin/rocniky/novy"
                                variant="outlined"
                            >
                                Vytvorit rocnik
                            </LinkButton>
                        </Box>
                    </CardContent>
                </Card>
            ) : albums.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            {params.q || params.yearId || params.status
                                ? "Zadna alba neodpovidaji filtru."
                                : "Zatim nebyla vytvorena zadna alba."}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <SelectableAlbumList albums={albums} />
            )}
        </Container>
    );
}
