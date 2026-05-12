import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import {
    CalendarMonth,
    ViewList,
    Newspaper,
    PhotoLibrary,
    Add,
} from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";

interface ObsahPageProps {
    params: Promise<{ id: string }>;
}

async function getYearContent(id: string) {
    return db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            _count: {
                select: {
                    programDays: true,
                    sectionTypes: true,
                    news: true,
                    albums: true,
                },
            },
        },
    });
}

interface StatCardProps {
    label: string;
    count: number;
    unit: string;
    href: string;
    icon: React.ReactNode;
}

function StatCard({ label, count, unit, href, icon }: StatCardProps) {
    return (
        <Grid item xs={6} sm={4} md={3}>
            <Card
                sx={{
                    height: "100%",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 4 },
                }}
            >
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Box sx={{ color: "primary.main", mb: 1 }}>{icon}</Box>
                    <Typography variant="h4" fontWeight="bold">
                        {count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {unit}
                    </Typography>
                    <LinkButton
                        href={href}
                        size="small"
                        sx={{ mt: 1 }}
                    >
                        {label}
                    </LinkButton>
                </CardContent>
            </Card>
        </Grid>
    );
}

export default async function ObsahPage({ params }: ObsahPageProps) {
    const { id } = await params;
    const year = await getYearContent(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Obsah" },
                ]}
                title="Obsah"
            />

            {/* Stats cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <StatCard
                    label="Program"
                    count={year._count.programDays}
                    unit="dnů"
                    href={`/admin/rocniky/${year.id}/program`}
                    icon={<CalendarMonth fontSize="large" />}
                />
                <StatCard
                    label="Sekce"
                    count={year._count.sectionTypes}
                    unit="typů sekcí"
                    href={`/admin/rocniky/${year.id}/sekce`}
                    icon={<ViewList fontSize="large" />}
                />
                <StatCard
                    label="Novinky"
                    count={year._count.news}
                    unit="novinek"
                    href={`/admin/rocniky/${year.id}/novinky`}
                    icon={<Newspaper fontSize="large" />}
                />
                <StatCard
                    label="Galerie"
                    count={year._count.albums}
                    unit="alb"
                    href={`/admin/rocniky/${year.id}/galerie`}
                    icon={<PhotoLibrary fontSize="large" />}
                />
            </Grid>

            {/* Quick actions */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Rychlé akce
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/program/novy-den`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nový den programu
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/sekce`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Spravovat sekce
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/novinky/nova`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nová novinka
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/galerie/nove`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nové album
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
