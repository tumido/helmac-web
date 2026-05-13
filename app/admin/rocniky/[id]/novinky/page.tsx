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
import { NewsList } from "@/components/admin/news-list";
import { Prisma } from "@prisma/client";

interface YearNewsPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ q?: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        select: { id: true, year: true, title: true },
    });
}

async function getNews(yearId: string, filters: { q?: string }) {
    const where: Prisma.NewsWhereInput = { yearId };

    if (filters.q) {
        where.OR = [
            { title: { contains: filters.q, mode: "insensitive" } },
            { content: { contains: filters.q, mode: "insensitive" } },
        ];
    }

    return db.news.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            year: {
                select: { year: true, title: true },
            },
            author: {
                select: { name: true },
            },
        },
    });
}

export default async function YearNewsPage({ params, searchParams }: YearNewsPageProps) {
    const { id } = await params;
    const search = await searchParams;
    const [year, news] = await Promise.all([getYear(id), getNews(id, search)]);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Novinky" },
                ]}
                title="Novinky"
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
                    href={`/admin/rocniky/${id}/novinky/nova`}
                    variant="contained"
                    startIcon={<Add />}
                >
                    Nová novinka
                </LinkButton>
            </Box>

            <ListFilters searchPlaceholder="Hledat novinky..." />

            {news.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            {search.q
                                ? "Žádné novinky neodpovídají filtru."
                                : "Zatím nebyly vytvořeny žádné novinky pro tento ročník."}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <NewsList
                    news={news}
                    editBasePath={`/admin/rocniky/${id}/novinky`}
                    showYear={false}
                />
            )}
        </Container>
    );
}
