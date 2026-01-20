import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Chip,
    Tooltip,
    Divider,
} from "@mui/material";
import {
    Edit,
    Add,
    CalendarMonth,
    Event,
} from "@mui/icons-material";
import { LinkButton, IconLinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getProgramDaysForYear } from "@/lib/services/program";
import { ProgramDayActions } from "@/components/admin/program-day-actions";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Program" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
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
                                        <IconLinkButton
                                            href={`/admin/rocniky/${year.id}/program/${day.id}`}
                                            size="small"
                                        >
                                            <Edit />
                                        </IconLinkButton>
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
