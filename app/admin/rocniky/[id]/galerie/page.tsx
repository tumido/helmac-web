import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ListFilters } from "@/components/admin/list-filters";
import { AlbumList } from "@/components/admin/album-list";
import { Prisma } from "@prisma/client";

interface YearGalleryPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ q?: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        select: { id: true, year: true, title: true },
    });
}

async function getAlbums(yearId: string, filters: { q?: string }) {
    const where: Prisma.AlbumWhereInput = { yearId };

    if (filters.q) {
        where.OR = [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
        ];
    }

    return db.album.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        include: {
            year: {
                select: { year: true, title: true },
            },
        },
    });
}

export default async function YearGalleryPage({ params, searchParams }: YearGalleryPageProps) {
    const { id } = await params;
    const search = await searchParams;
    const [year, albums] = await Promise.all([getYear(id), getAlbums(id, search)]);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Galerie" },
                ]}
                title="Galerie"
            />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <LinkButton
                    href={`/admin/rocniky/${id}/galerie/nove`}
                    variant="contained"
                    startIcon={<Add />}
                >
                    Nové album
                </LinkButton>
            </Box>

            <ListFilters searchPlaceholder="Hledat alba..." />

            {albums.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            {search.q
                                ? "Žádná alba neodpovídají filtru."
                                : "Zatím nebyla vytvořena žádná alba pro tento ročník."}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <AlbumList
                    albums={albums}
                    editBasePath={`/admin/rocniky/${id}/galerie`}
                    showYear={false}
                />
            )}
        </Container>
    );
}
