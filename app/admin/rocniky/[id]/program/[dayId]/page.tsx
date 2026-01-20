import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
} from "@mui/material";
import {
    Add,
    CalendarMonth,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getProgramDayWithEvents } from "@/lib/services/program";
import { ProgramDayForm } from "@/components/forms/program-day-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { SortableEvents } from "@/components/admin/sortable-events";

interface EditDayPageProps {
    params: Promise<{ id: string; dayId: string }>;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

export default async function EditDayPage({ params }: EditDayPageProps) {
    const { id, dayId } = await params;
    const day = await getProgramDayWithEvents(dayId);

    if (!day || day.yearId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${day.year.year}`, href: `/admin/rocniky/${day.year.id}` },
                    { label: "Program", href: `/admin/rocniky/${day.year.id}/program` },
                    { label: day.label },
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
                    <Typography variant="h4">{day.label}</Typography>
                </Box>
                <Typography color="text.secondary">
                    {formatDate(day.date)} | {day.year.year} - {day.year.title}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1.5fr" },
                    gap: 4,
                }}
            >
                {/* Day Settings */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Nastaveni dne
                    </Typography>
                    <ProgramDayForm
                        mode="edit"
                        yearId={day.year.id}
                        dayId={day.id}
                        defaultValues={{
                            date: day.date,
                            label: day.label,
                            sortOrder: day.sortOrder,
                        }}
                    />
                </Box>

                {/* Events List */}
                <Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">Udalosti</Typography>
                        <LinkButton
                            href={`/admin/rocniky/${day.year.id}/program/${day.id}/nova-udalost`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nova udalost
                        </LinkButton>
                    </Box>

                    {day.events.length === 0 ? (
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" textAlign="center">
                                    Zatim nebyly vytvoreny zadne udalosti.
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <SortableEvents
                            yearId={day.year.id}
                            dayId={day.id}
                            events={day.events}
                        />
                    )}
                </Box>
            </Box>
        </Container>
    );
}
