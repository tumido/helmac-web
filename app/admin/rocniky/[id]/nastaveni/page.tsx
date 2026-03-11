import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { PageHeader } from "@/components/admin/page-header";
import { YearSettingsView } from "@/components/admin/year-settings-view";

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
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Nastavení" },
                ]}
                title="Nastavení ročníku"
            />
            <YearSettingsView
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
