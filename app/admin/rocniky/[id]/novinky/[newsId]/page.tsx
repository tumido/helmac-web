import { Container } from "@mui/material";
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
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${news.year.year} - ${news.year.title}`, href: `/admin/rocniky/${id}` },
                    { label: "Novinky", href: `/admin/rocniky/${id}/novinky` },
                    { label: news.title },
                ]}
                title="Upravit novinku"
            />

            <NewsForm
                mode="edit"
                years={[news.year]}
                newsId={news.id}
                defaultValues={{
                    yearId: news.yearId,
                    title: news.title,
                    content: news.content,
                    actionButtons: news.actionButtons as { label: string; url: string; variant?: "contained" | "outlined" }[],
                }}
                cancelHref={`/admin/rocniky/${id}/novinky`}
                redirectTo={`/admin/rocniky/${id}/novinky`}
            />
        </Container>
    );
}
