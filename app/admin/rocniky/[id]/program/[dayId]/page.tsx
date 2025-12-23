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
    AccessTime,
    Place,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramDayWithEvents } from "@/lib/services/program";
import { ProgramDayForm } from "@/components/forms/program-day-form";
import { ProgramEventActions } from "@/components/admin/program-event-actions";

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
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href={`/admin/rocniky/${day.year.id}/program`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na program
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
                        <Button
                            component={Link}
                            href={`/admin/rocniky/${day.year.id}/program/${day.id}/nova-udalost`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nova udalost
                        </Button>
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
                        <Card>
                            {day.events.map((event, index) => (
                                <Box key={event.id}>
                                    {index > 0 && <Divider />}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 2,
                                            p: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                minWidth: 60,
                                                color: "text.secondary",
                                            }}
                                        >
                                            <AccessTime fontSize="small" />
                                            <Typography variant="body2" fontWeight="medium">
                                                {event.startTime}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <Typography fontWeight="medium">
                                                    {event.title}
                                                </Typography>
                                                <Chip
                                                    label={
                                                        event.isPublished
                                                            ? "Publikovano"
                                                            : "Skryto"
                                                    }
                                                    size="small"
                                                    color={
                                                        event.isPublished
                                                            ? "success"
                                                            : "default"
                                                    }
                                                    icon={
                                                        event.isPublished ? (
                                                            <Visibility />
                                                        ) : (
                                                            <VisibilityOff />
                                                        )
                                                    }
                                                />
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                }}
                                            >
                                                <Place fontSize="small" />
                                                <Typography variant="body2">
                                                    {event.location}
                                                </Typography>
                                            </Box>
                                            {event.tags.length > 0 && (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 0.5,
                                                        flexWrap: "wrap",
                                                        mt: 1,
                                                    }}
                                                >
                                                    {event.tags.map((tag) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                            }}
                                        >
                                            <Tooltip title="Upravit udalost">
                                                <IconButton
                                                    component={Link}
                                                    href={`/admin/rocniky/${day.year.id}/program/${day.id}/${event.id}`}
                                                    size="small"
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <ProgramEventActions
                                                eventId={event.id}
                                                isPublished={event.isPublished}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Card>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
