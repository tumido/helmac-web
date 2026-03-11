import { Container, Typography, Box, Button } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";
import { PageHeader } from "@/components/admin/page-header";

interface YearEditNewsPageProps {
    params: Promise<{ id: string; newsId: string }>;
}

async function getNews(newsId: string) {
    return db.news.findUnique({
        where: { id: newsId },
        include: {
            year: {
                select: { id: true, year: true, title: true },
            },
        },
    });
}

export default async function YearEditNewsPage({ params }: YearEditNewsPageProps) {
    const { id, newsId } = await params;
    const news = await getNews(newsId);

    if (!news || news.yearId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${news.year.year} - ${news.year.title}`, href: `/admin/rocniky/${id}` },
                    { label: "Novinky", href: `/admin/rocniky/${id}/novinky` },
                    { label: news.title },
                ]}
                title="Upravit novinku"
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
                years={[news.year]}
                newsId={news.id}
                defaultValues={{
                    yearId: news.yearId,
                    slug: news.slug,
                    title: news.title,
                    excerpt: news.excerpt,
                    content: news.content,
                    coverImage: news.coverImage,
                }}
                cancelHref={`/admin/rocniky/${id}/novinky`}
                redirectTo={`/admin/rocniky/${id}/novinky`}
            />
        </Container>
    );
}
