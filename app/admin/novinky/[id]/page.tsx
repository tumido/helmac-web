import { Container, Typography, Box, Chip, Button } from "@mui/material";
import { Visibility, VisibilityOff, OpenInNew } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

interface EditNewsPageProps {
    params: Promise<{ id: string }>;
}

async function getNews(id: string) {
    return db.news.findUnique({
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

export default async function EditNewsPage({ params }: EditNewsPageProps) {
    const { id } = await params;
    const [news, years] = await Promise.all([getNews(id), getYears()]);

    if (!news) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Novinky", href: "/admin/novinky" },
                    { label: news.title },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h4">Upravit novinku</Typography>
                        <Chip
                            label={news.isPublished ? "Publikovano" : "Skryto"}
                            size="small"
                            color={news.isPublished ? "success" : "default"}
                            icon={
                                news.isPublished ? <Visibility /> : <VisibilityOff />
                            }
                        />
                    </Box>
                    <Button
                        href={`/${news.year.year}/novinky/${news.slug}`}
                        target="_blank"
                        variant="outlined"
                        startIcon={<OpenInNew />}
                    >
                        Nahled
                    </Button>
                </Box>
                <Typography color="text.secondary">
                    {news.year.year} - {news.title}
                </Typography>
            </Box>

            <NewsForm
                mode="edit"
                years={years}
                newsId={news.id}
                defaultValues={{
                    yearId: news.yearId,
                    slug: news.slug,
                    title: news.title,
                    excerpt: news.excerpt,
                    content: news.content,
                    coverImage: news.coverImage,
                    isPublished: news.isPublished,
                }}
            />
        </Container>
    );
}
