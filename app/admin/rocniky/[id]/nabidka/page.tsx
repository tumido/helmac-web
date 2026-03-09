import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
} from "@mui/material";
import {
    Add,
    LocalOffer,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getOffersForYear } from "@/lib/services/offers";
import { SortableOffers } from "@/components/admin/sortable-offers";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Co nabízíme" },
                ]}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <LocalOffer sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h4">Co nabízíme</Typography>
            </Box>

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
