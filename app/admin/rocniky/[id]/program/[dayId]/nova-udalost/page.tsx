import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getProgramDayWithEvents, getAllTagsForYear } from "@/lib/services/program";
import { ProgramEventForm } from "@/components/forms/program-event-form";
import { PageHeader } from "@/components/admin/page-header";

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
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${day.year.year}`, href: `/admin/rocniky/${day.year.id}` },
                    { label: "Program", href: `/admin/rocniky/${day.year.id}/program` },
                    { label: day.label, href: `/admin/rocniky/${day.year.id}/program/${day.id}` },
                    { label: "Nova udalost" },
                ]}
                title="Nova udalost"
            />
            <Box sx={{ mb: 4 }}>
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
