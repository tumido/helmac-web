import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Paper,
    Chip,
} from "@mui/material";
import {
    CalendarMonth,
    Gavel,
    LocalOffer,
    InfoOutlined,
    PhotoLibrary,
    Newspaper,
    Add,
    AppRegistration,
} from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYearOverview(id: string) {
    return db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            registrationOpen: true,
            _count: {
                select: {
                    registrationSubmissions: true,
                    albums: true,
                    news: true,
                    rules: true,
                    offers: true,
                    programDays: true,
                    infoSections: true,
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
                    label="Pravidla"
                    count={year._count.rules}
                    unit="pravidel"
                    href={`/admin/rocniky/${year.id}/pravidla`}
                    icon={<Gavel fontSize="large" />}
                />
                <StatCard
                    label="Nabídky"
                    count={year._count.offers}
                    unit="nabídek"
                    href={`/admin/rocniky/${year.id}/nabidka`}
                    icon={<LocalOffer fontSize="large" />}
                />
                <StatCard
                    label="Info"
                    count={year._count.infoSections}
                    unit="sekcí"
                    href={`/admin/rocniky/${year.id}/info`}
                    icon={<InfoOutlined fontSize="large" />}
                />
                <StatCard
                    label="Galerie"
                    count={year._count.albums}
                    unit="alb"
                    href="/admin/galerie"
                    icon={<PhotoLibrary fontSize="large" />}
                />
                <StatCard
                    label="Novinky"
                    count={year._count.news}
                    unit="novinek"
                    href="/admin/novinky"
                    icon={<Newspaper fontSize="large" />}
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
                            href={`/admin/rocniky/${year.id}/pravidla/nove`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nové pravidlo
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/nabidka/nove`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nová nabídka
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/info/nove`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nová info sekce
                        </LinkButton>
                        <LinkButton
                            href={`/admin/galerie/nove?yearId=${year.id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nová galerie
                        </LinkButton>
                        <LinkButton
                            href={`/admin/novinky/nova?yearId=${year.id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nová novinka
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
