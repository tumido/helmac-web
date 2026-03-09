import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { YearForm } from "@/components/forms/year-form";

interface NastaveniPageProps {
    params: Promise<{ id: string }>;
}

export default async function NastaveniPage({ params }: NastaveniPageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Nastavení" },
                ]}
            />
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4">Nastavení ročníku</Typography>
            </Box>
            <YearForm
                mode="edit"
                yearId={year.id}
                defaultValues={{
                    year: year.year,
                    title: year.title,
                    subtitle: year.subtitle,
                    startDate: year.startDate,
                    endDate: year.endDate,
                    headerPhoto: year.headerPhoto,
                    heroPhoto: year.heroPhoto,
                }}
            />
        </Container>
    );
}
