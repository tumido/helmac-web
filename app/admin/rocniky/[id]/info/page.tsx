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
import { getInfoSectionsForYear } from "@/lib/services/info";
import { SortableInfo } from "@/components/admin/sortable-info";
import { PageHeader } from "@/components/admin/page-header";

interface InfoPageProps {
    params: Promise<{ id: string }>;
}

export default async function InfoPage({ params }: InfoPageProps) {
    const { id } = await params;
    const [year, infoSections] = await Promise.all([
        getYearById(id),
        getInfoSectionsForYear(id),
    ]);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info" },
                ]}
                title="Info"
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Info sekce</Typography>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/info/nove`}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Pridat info sekci
                </LinkButton>
            </Box>

            {infoSections.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyly vytvoreny zadne info sekce.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <SortableInfo yearId={year.id} infoSections={infoSections} />
            )}
        </Container>
    );
}
