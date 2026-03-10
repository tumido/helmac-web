import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getOfferById } from "@/lib/services/offers";
import { OfferForm } from "@/components/forms/offer-form";
import { PageHeader } from "@/components/admin/page-header";

interface EditOfferPageProps {
    params: Promise<{ id: string; offerId: string }>;
}

export default async function EditOfferPage({ params }: EditOfferPageProps) {
    const { id, offerId } = await params;
    const [year, offer] = await Promise.all([
        getYearById(id),
        getOfferById(offerId),
    ]);

    if (!year || !offer) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Co nabízíme", href: `/admin/rocniky/${year.id}/nabidka` },
                    { label: offer.title },
                ]}
                title="Upravit nabídku"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <OfferForm
                mode="edit"
                yearId={year.id}
                offerId={offer.id}
                defaultValues={{
                    title: offer.title,
                    content: offer.content,
                }}
            />
        </Container>
    );
}
