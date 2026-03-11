import {
    Box,
    Container,
    Typography,
    Paper,
    Chip,
} from "@mui/material";
import {
    AppRegistration,
} from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

function formatDateRange(startDate: Date | null, endDate: Date | null): string | null {
    if (!startDate || !endDate) return null;
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    return `${startDay}.${startMonth}. – ${endDay}.${endMonth}.${endYear}`;
}

async function getYearOverview(id: string) {
    return db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            registrationOpen: true,
            startDate: true,
            endDate: true,
            _count: {
                select: {
                    registrationSubmissions: true,
                },
            },
        },
    });
}

export default async function EditYearPage({ params }: EditYearPageProps) {
    const { id } = await params;
    const year = await getYearOverview(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}` },
                ]}
                title="Přehled"
            />

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Ročník {year.year} — {year.title}
                </Typography>
                {formatDateRange(year.startDate, year.endDate) && (
                    <Typography variant="body2" color="text.secondary">
                        {formatDateRange(year.startDate, year.endDate)}
                    </Typography>
                )}
            </Box>

            {/* Registration status banner */}
            <Paper
                sx={{
                    p: 2,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <AppRegistration color={year.registrationOpen ? "success" : "disabled"} />
                <Typography variant="body1" sx={{ flex: 1 }}>
                    Registrace je{" "}
                    <strong>{year.registrationOpen ? "otevřena" : "uzavřena"}</strong>
                </Typography>
                <Chip
                    label={`${year._count.registrationSubmissions} přihlášek`}
                    color="primary"
                    variant="outlined"
                    size="small"
                />
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace`}
                    variant="outlined"
                    size="small"
                >
                    Spravovat
                </LinkButton>
            </Paper>
        </Container>
    );
}
