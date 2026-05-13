import { Container } from "@mui/material";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";
import { PageHeader } from "@/components/admin/page-header";

async function getYears() {
    return db.year.findMany({
        where: { isArchived: false },
        orderBy: { year: "desc" },
        select: { id: true, year: true, title: true },
    });
}

interface NewNewsPageProps {
    searchParams: Promise<{ yearId?: string }>;
}

export default async function NewNewsPage({ searchParams }: NewNewsPageProps) {
    const { yearId } = await searchParams;
    const years = await getYears();

    if (years.length === 0) {
        redirect("/admin/rocniky/novy");
    }

    return (
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Novinky", href: "/admin/novinky" },
                    { label: "Nova novinka" },
                ]}
                title="Nova novinka"
            />

            <NewsForm mode="create" years={years} defaultValues={yearId ? { yearId } : undefined} />
        </Container>
    );
}
