import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActions,
    Box,
    Button,
    Chip,
} from "@mui/material";
import { Add, Edit, Archive, Star } from "@mui/icons-material";
import Link from "next/link";
import { db } from "@/lib/db";
import { YearActions } from "@/components/admin/year-actions";

async function getYears() {
    return db.year.findMany({
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

export default async function YearsPage() {
    const years = await getYears();

    return (
        <Container maxWidth="lg">
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <Typography variant="h4">Rocniky</Typography>
                <Button
                    component={Link}
                    href="/admin/rocniky/novy"
                    variant="contained"
                    startIcon={<Add />}
                >
                    Novy rocnik
                </Button>
            </Box>

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyly vytvoreny zadne rocniky.
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
                                                label="Aktivni"
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
                                        {year._count.pages} stranek
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
                                            new Date(
                                                year.startDate
                                            ).toLocaleDateString("cs-CZ")}
                                        {year.startDate && year.endDate && " - "}
                                        {year.endDate &&
                                            new Date(
                                                year.endDate
                                            ).toLocaleDateString("cs-CZ")}
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
                                <Button
                                    component={Link}
                                    href={`/admin/rocniky/${year.id}`}
                                    size="small"
                                    startIcon={<Edit />}
                                >
                                    Upravit
                                </Button>
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
