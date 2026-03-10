import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getOffersForYear } from "@/lib/services/offers";
import { SortableOffers } from "@/components/admin/sortable-offers";
import { PageHeader } from "@/components/admin/page-header";

interface NabidkaPageProps {
    params: Promise<{ id: string }>;
}

export default async function NabidkaPage({ params }: NabidkaPageProps) {
    const { id } = await params;
    const [year, offers] = await Promise.all([
        getYearById(id),
        getOffersForYear(id),
    ]);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Co nabízíme" },
                ]}
                title="Co nabízíme"
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Sekce nabídek</Typography>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/nabidka/nove`}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Přidat nabídku
                </LinkButton>
            </Box>

            {offers.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatím nebyly vytvořeny žádné nabídky.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <SortableOffers yearId={year.id} offers={offers} />
            )}
        </Container>
    );
}
