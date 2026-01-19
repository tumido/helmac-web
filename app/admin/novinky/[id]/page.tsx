import { Container, Typography, Box, Chip } from "@mui/material";
import { ArrowBack, Visibility, VisibilityOff } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";

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
            <Box sx={{ mb: 4 }}>
                <LinkButton
                    href="/admin/novinky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na novinky
                </LinkButton>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
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
