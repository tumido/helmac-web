import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import {
    getProgramEvent,
    getAllTagsForYear,
} from "@/lib/services/program";
import { ProgramEventForm } from "@/components/forms/program-event-form";
import { PageHeader } from "@/components/admin/page-header";

interface EditEventPageProps {
    params: Promise<{
        id: string;
        dayId: string;
        eventId: string;
    }>;
}

export default async function EditEventPage({
    params,
}: EditEventPageProps) {
    const { id, dayId, eventId } = await params;
    const [event, existingTags] = await Promise.all([
        getProgramEvent(eventId),
        getAllTagsForYear(id),
    ]);

    if (
        !event ||
        event.dayId !== dayId ||
        event.day.year.id !== id
    ) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${event.day.year.year}`,
                        href: `/admin/rocniky/${event.day.year.id}`,
                    },
                    {
                        label: "Program",
                        href: `/admin/rocniky/${event.day.year.id}/program`,
                    },
                    {
                        label: event.day.label,
                        href: `/admin/rocniky/${event.day.year.id}/program/${event.day.id}`,
                    },
                    { label: event.title },
                ]}
                title={`${event.title} — ${event.startTime}`}
            />

            <ProgramEventForm
                mode="edit"
                yearId={event.day.year.id}
                dayId={event.day.id}
                eventId={event.id}
                existingTags={existingTags}
                defaultValues={{
                    startTime: event.startTime,
                    endTime: event.endTime ?? null,
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    imageUrl: event.imageUrl,
                    tags: event.tags,
                    actionButtons:
                        (event.actionButtons as Array<{
                            label: string;
                            url: string;
                            variant?: "contained" | "outlined" | "text";
                        }>) ?? [],
                }}
            />
        </Container>
    );
}
