import Link from "next/link";
import { Container, Grid, Typography, Box } from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";
import { PageHeader, Card } from "@/components/public/ui";
import { getArchivedYears } from "@/lib/services";

export const metadata = {
    title: "Archiv | Helmac",
    description: "Archiv minulych rocniku akce Helmac",
};

export default async function ArchivPage() {
    const years = await getArchivedYears();

    return (
        <>
            <PageHeader
                title="Archiv"
                subtitle="Nahlednete do minulych rocniku"
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                {years.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography color="text.secondary">
                            Zatim zadne archivovane rocniky
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={4}>
                        {years.map((year) => {
                            const dateRange =
                                year.startDate && year.endDate
                                    ? `${new Date(
                                          year.startDate
                                      ).toLocaleDateString("cs-CZ")} - ${new Date(
                                          year.endDate
                                      ).toLocaleDateString("cs-CZ")}`
                                    : null;

                            return (
                                <Grid item key={year.id} xs={12} sm={6} md={4}>
                                    <Link
                                        href={`/archiv/${year.year}`}
                                        style={{
                                            textDecoration: "none",
                                            color: "inherit",
                                        }}
                                    >
                                        <Card
                                            sx={{
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    fontFamily:
                                                        '"Cinzel", serif',
                                                    color: "primary.main",
                                                    mb: 1,
                                                }}
                                            >
                                                {year.year}
                                            </Typography>
                                            <Typography variant="h6" gutterBottom>
                                                {year.title}
                                            </Typography>
                                            {year.subtitle && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ mb: 2 }}
                                                >
                                                    {year.subtitle}
                                                </Typography>
                                            )}
                                            {dateRange && (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.5,
                                                        color: "text.secondary",
                                                        mt: "auto",
                                                    }}
                                                >
                                                    <CalendarMonth fontSize="small" />
                                                    <Typography variant="caption">
                                                        {dateRange}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Card>
                                    </Link>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>
        </>
    );
}
