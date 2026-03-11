import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActions,
    Box,
    Chip,
} from "@mui/material";
import { Add, Edit, Archive, Star } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { db } from "@/lib/db";
import { YearActions } from "@/components/admin/year-actions";
import { PageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils/date";
import { ListFilters } from "@/components/admin/list-filters";
import { Prisma } from "@prisma/client";

interface YearsPageProps {
    searchParams: Promise<{ q?: string }>;
}

async function getYears(filters: { q?: string }) {
    const where: Prisma.YearWhereInput = {};

    if (filters.q) {
        const numericQuery = parseInt(filters.q, 10);
        where.OR = [
            { title: { contains: filters.q, mode: "insensitive" } },
            { subtitle: { contains: filters.q, mode: "insensitive" } },
            ...(isNaN(numericQuery) ? [] : [{ year: numericQuery }]),
        ];
    }

    return db.year.findMany({
        where,
        orderBy: { year: "desc" },
        include: {
            _count: {
                select: {
                    pages: true,
                    news: true,
                    albums: true,
                },
            },
        },
    });
}

export default async function YearsPage({ searchParams }: YearsPageProps) {
    const params = await searchParams;
    const years = await getYears(params);

    return (
        <Container maxWidth="lg">
            <PageHeader breadcrumbs={[{ label: "Ročníky" }]} title="Ročníky" />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <LinkButton
                    href="/admin/rocniky/novy"
                    variant="contained"
                    startIcon={<Add />}
                >
                    Nový ročník
                </LinkButton>
            </Box>

            <ListFilters searchPlaceholder="Hledat ročníky..." />

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            {params.q
                                ? "Žádné ročníky neodpovídají hledání."
                                : "Zatím nebyly vytvořeny žádné ročníky."}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            lg: "repeat(3, 1fr)",
                        },
                        gap: 3,
                    }}
                >
                    {years.map((year) => (
                        <Card
                            key={year.id}
                            sx={{
                                position: "relative",
                                border: year.isActive
                                    ? "2px solid"
                                    : "1px solid",
                                borderColor: year.isActive
                                    ? "primary.main"
                                    : "divider",
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h5"
                                            fontWeight="bold"
                                        >
                                            {year.year}
                                        </Typography>
                                        <Typography
                                            variant="subtitle1"
                                            color="text.secondary"
                                        >
                                            {year.title}
                                        </Typography>
                                        {year.subtitle && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {year.subtitle}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                        {year.isActive && (
                                            <Chip
                                                label="Aktivní"
                                                color="primary"
                                                size="small"
                                                icon={<Star />}
                                            />
                                        )}
                                        {year.isArchived && (
                                            <Chip
                                                label="Archiv"
                                                color="default"
                                                size="small"
                                                icon={<Archive />}
                                            />
                                        )}
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 2,
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {year._count.pages} stránek
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {year._count.news} novinek
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {year._count.albums} alb
                                    </Typography>
                                </Box>

                                {(year.startDate || year.endDate) && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {year.startDate &&
                                            formatDate(year.startDate)}
                                        {year.startDate && year.endDate && " - "}
                                        {year.endDate &&
                                            formatDate(year.endDate)}
                                    </Typography>
                                )}
                            </CardContent>

                            <CardActions
                                sx={{
                                    justifyContent: "space-between",
                                    px: 2,
                                    pb: 2,
                                }}
                            >
                                <LinkButton
                                    href={`/admin/rocniky/${year.id}`}
                                    size="small"
                                    startIcon={<Edit />}
                                >
                                    Upravit
                                </LinkButton>
                                <YearActions
                                    yearId={year.id}
                                    isActive={year.isActive}
                                    isArchived={year.isArchived}
                                />
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            )}
        </Container>
    );
}
