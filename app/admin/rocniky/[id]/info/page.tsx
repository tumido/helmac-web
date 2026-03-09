import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
} from "@mui/material";
import {
    Add,
    InfoOutlined,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getInfoSectionsForYear } from "@/lib/services/info";
import { SortableInfo } from "@/components/admin/sortable-info";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info" },
                ]}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <InfoOutlined sx={{ fontSize: 32, color: "primary.main" }} />
                <Typography variant="h4">Info</Typography>
            </Box>

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
