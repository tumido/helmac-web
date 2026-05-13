import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";
import { PageHeader } from "@/components/admin/page-header";

interface YearNewNewsPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        select: { id: true, year: true, title: true },
    });
}

export default async function YearNewNewsPage({ params }: YearNewNewsPageProps) {
    const { id } = await params;
    const year = await getYear(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Novinky", href: `/admin/rocniky/${year.id}/novinky` },
                    { label: "Nová novinka" },
                ]}
                title="Nová novinka"
            />

            <NewsForm
                mode="create"
                years={[year]}
                defaultValues={{ yearId: year.id }}
                hideYearSelect
                cancelHref={`/admin/rocniky/${id}/novinky`}
                redirectTo={`/admin/rocniky/${id}/novinky`}
            />
        </Container>
    );
}
