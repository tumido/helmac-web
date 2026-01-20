import { Container, Typography, Box, Chip } from "@mui/material";
import {
    Event,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getProgramEvent, getAllTagsForYear } from "@/lib/services/program";
import { ProgramEventForm } from "@/components/forms/program-event-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

interface EditEventPageProps {
    params: Promise<{ id: string; dayId: string; eventId: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
    const { id, dayId, eventId } = await params;
    const [event, existingTags] = await Promise.all([
        getProgramEvent(eventId),
        getAllTagsForYear(id),
    ]);

    if (!event || event.dayId !== dayId || event.day.year.id !== id) {
        notFound();
    }

    return (
        <Container maxWidth="sm">
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${event.day.year.year}`, href: `/admin/rocniky/${event.day.year.id}` },
                    { label: "Program", href: `/admin/rocniky/${event.day.year.id}/program` },
                    { label: event.day.label, href: `/admin/rocniky/${event.day.year.id}/program/${event.day.id}` },
                    { label: event.title },
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
                    <Event sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Upravit udalost</Typography>
                    <Chip
                        label={event.isPublished ? "Publikovano" : "Skryto"}
                        size="small"
                        color={event.isPublished ? "success" : "default"}
                        icon={
                            event.isPublished ? <Visibility /> : <VisibilityOff />
                        }
                    />
                </Box>
                <Typography color="text.secondary">
                    {event.startTime} - {event.title}
                </Typography>
            </Box>

            <ProgramEventForm
                mode="edit"
                yearId={event.day.year.id}
                dayId={event.day.id}
                eventId={event.id}
                existingTags={existingTags}
                defaultValues={{
                    startTime: event.startTime,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    imageUrl: event.imageUrl,
                    tags: event.tags,
                    isPublished: event.isPublished,
                    sortOrder: event.sortOrder,
                }}
            />
        </Container>
    );
}
