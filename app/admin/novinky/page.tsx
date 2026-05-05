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
import { NewsList } from "@/components/admin/news-list";
import { Prisma } from "@prisma/client";

interface NewsListPageProps {
    searchParams: Promise<{ q?: string; yearId?: string }>;
}

async function getNews(filters: { q?: string; yearId?: string }) {
    const where: Prisma.NewsWhereInput = {};

    if (filters.q) {
        where.OR = [
            { title: { contains: filters.q, mode: "insensitive" } },
            { content: { contains: filters.q, mode: "insensitive" } },
            { excerpt: { contains: filters.q, mode: "insensitive" } },
        ];
    }

    if (filters.yearId) {
        where.yearId = filters.yearId;
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

async function getYears() {
    return db.year.findMany({
        where: { isArchived: false },
        orderBy: { year: "desc" },
        select: { id: true, year: true, title: true },
    });
}

export default async function NewsListPage({ searchParams }: NewsListPageProps) {
    const params = await searchParams;
    const [news, years] = await Promise.all([getNews(params), getYears()]);

    return (
        <Container maxWidth="lg">
            <PageHeader breadcrumbs={[{ label: "Novinky" }]} title="Novinky" />
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
                        href="/admin/novinky/nova"
                        variant="contained"
                        startIcon={<Add />}
                    >
                        Nová novinka
                    </LinkButton>
                )}
            </Box>

            {years.length > 0 && (
                <ListFilters
                    showYearFilter
                    years={years}
                    searchPlaceholder="Hledat novinky..."
                />
            )}

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Nejprve vytvořte ročník pro přidávání novinek.
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
            ) : news.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            {params.q || params.yearId
                                ? "Žádné novinky neodpovídají filtru."
                                : "Zatím nebyly vytvořeny žádné novinky."}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <NewsList news={news} />
            )}
        </Container>
    );
}
