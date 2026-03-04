import { Container, Typography, Box } from "@mui/material";
import { LocalOffer } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { OfferForm } from "@/components/forms/offer-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Co nabízíme", href: `/admin/rocniky/${year.id}/nabidka` },
                    { label: "Nová nabídka" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <LocalOffer sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Nová nabídka</Typography>
                </Box>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <OfferForm mode="create" yearId={year.id} />
        </Container>
    );
}
