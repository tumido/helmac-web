import { Container, Typography, Box } from "@mui/material";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Novinky", href: "/admin/novinky" },
                    { label: "Nova novinka" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4">Nova novinka</Typography>
            </Box>

            <NewsForm mode="create" years={years} defaultValues={yearId ? { yearId } : undefined} />
        </Container>
    );
}
