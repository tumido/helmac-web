import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { OfferForm } from "@/components/forms/offer-form";
import { PageHeader } from "@/components/admin/page-header";

interface NewOfferPageProps {
    params: Promise<{ id: string }>;
}

export default async function NewOfferPage({ params }: NewOfferPageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Co nabízíme", href: `/admin/rocniky/${year.id}/nabidka` },
                    { label: "Nová nabídka" },
                ]}
                title="Nová nabídka"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <OfferForm mode="create" yearId={year.id} />
        </Container>
    );
}
