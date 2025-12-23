import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tooltip,
    Divider,
} from "@mui/material";
import {
    ArrowBack,
    Edit,
    Add,
    CalendarMonth,
    Event,
} from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getProgramDaysForYear } from "@/lib/services/program";
import { ProgramDayActions } from "@/components/admin/program-day-actions";

interface ProgramPageProps {
    params: Promise<{ id: string }>;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("cs-CZ", {
        weekday: "short",
        day: "numeric",
        month: "numeric",
    }).format(new Date(date));
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
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href={`/admin/rocniky/${year.id}`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocnik {year.year}
                </Button>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <CalendarMonth sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Program</Typography>
                </Box>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Dny programu</Typography>
                <Button
                    component={Link}
                    href={`/admin/rocniky/${year.id}/program/novy-den`}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Pridat den
                </Button>
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
                <Card>
                    {days.map((day, index) => (
                        <Box key={day.id}>
                            {index > 0 && <Divider />}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: 2,
                                }}
                            >
                                <CalendarMonth sx={{ color: "text.disabled" }} />
                                <Box sx={{ flex: 1 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Typography fontWeight="medium">
                                            {day.label}
                                        </Typography>
                                        <Chip
                                            label={formatDate(day.date)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            color: "text.secondary",
                                        }}
                                    >
                                        <Event fontSize="small" />
                                        <Typography variant="body2">
                                            {day._count.events}{" "}
                                            {day._count.events === 1
                                                ? "udalost"
                                                : day._count.events < 5
                                                  ? "udalosti"
                                                  : "udalosti"}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                >
                                    <Tooltip title="Spravovat den">
                                        <IconButton
                                            component={Link}
                                            href={`/admin/rocniky/${year.id}/program/${day.id}`}
                                            size="small"
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <ProgramDayActions
                                        dayId={day.id}
                                        eventsCount={day._count.events}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Card>
            )}
        </Container>
    );
}
