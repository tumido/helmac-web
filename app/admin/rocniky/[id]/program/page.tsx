import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
} from "@mui/material";
import {
    Add,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getProgramDaysForYear } from "@/lib/services/program";
import { SortableDays } from "@/components/admin/sortable-days";
import { PageHeader } from "@/components/admin/page-header";

interface ProgramPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
    const { id } = await params;
    const [year, days] = await Promise.all([
        getYearById(id),
        getProgramDaysForYear(id),
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
                    { label: "Program" },
                ]}
                title="Program"
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Dny programu</Typography>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/program/novy-den`}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Pridat den
                </LinkButton>
            </Box>

            {days.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyly vytvoreny zadne dny programu.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <SortableDays yearId={year.id} days={days} />
            )}
        </Container>
    );
}
