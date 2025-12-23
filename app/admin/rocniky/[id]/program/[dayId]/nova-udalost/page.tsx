import { Container, Typography, Box, Button } from "@mui/material";
import { ArrowBack, Event } from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramDayWithEvents, getAllTagsForYear } from "@/lib/services/program";
import { ProgramEventForm } from "@/components/forms/program-event-form";

interface NewEventPageProps {
    params: Promise<{ id: string; dayId: string }>;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date(date));
}

export default async function NewEventPage({ params }: NewEventPageProps) {
    const { id, dayId } = await params;
    const [day, existingTags] = await Promise.all([
        getProgramDayWithEvents(dayId),
        getAllTagsForYear(id),
    ]);

    if (!day || day.yearId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href={`/admin/rocniky/${day.year.id}/program/${day.id}`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na {day.label}
                </Button>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Event sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Nova udalost</Typography>
                </Box>
                <Typography color="text.secondary">
                    {day.label} - {formatDate(day.date)}
                </Typography>
            </Box>

            <ProgramEventForm
                mode="create"
                yearId={day.year.id}
                dayId={day.id}
                existingTags={existingTags}
            />
        </Container>
    );
}
