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
import { getRulesForYear } from "@/lib/services/rules";
import { SortableRules } from "@/components/admin/sortable-rules";
import { PageHeader } from "@/components/admin/page-header";

interface PravidlaPageProps {
    params: Promise<{ id: string }>;
}

export default async function PravidlaPage({ params }: PravidlaPageProps) {
    const { id } = await params;
    const [year, rules] = await Promise.all([
        getYearById(id),
        getRulesForYear(id),
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
                    { label: "Pravidla" },
                ]}
                title="Pravidla"
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Sekce pravidel</Typography>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/pravidla/nove`}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Pridat pravidlo
                </LinkButton>
            </Box>

            {rules.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyla vytvorena zadna pravidla.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <SortableRules yearId={year.id} rules={rules} />
            )}
        </Container>
    );
}
