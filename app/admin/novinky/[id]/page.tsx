import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";
import { PageHeader } from "@/components/admin/page-header";

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
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Novinky", href: "/admin/novinky" },
                    { label: news.title },
                ]}
                title="Upravit novinku"
            />

            <NewsForm
                mode="edit"
                years={years}
                newsId={news.id}
                defaultValues={{
                    yearId: news.yearId,
                    title: news.title,
                    content: news.content,
                    actionButtons: news.actionButtons as { label: string; url: string; variant?: "contained" | "outlined" }[],
                }}
            />
        </Container>
    );
}
