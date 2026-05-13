import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import {
    getProgramDayWithEvents,
    getAllTagsForYear,
} from "@/lib/services/program";
import { ProgramEventForm } from "@/components/forms/program-event-form";
import { PageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils/date";

interface NewEventPageProps {
    params: Promise<{ id: string; dayId: string }>;
}

export default async function NewEventPage({
    params,
}: NewEventPageProps) {
    const { id, dayId } = await params;
    const [day, existingTags] = await Promise.all([
        getProgramDayWithEvents(dayId),
        getAllTagsForYear(id),
    ]);

    if (!day || day.yearId !== id) {
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
                        label: `${day.year.year}`,
                        href: `/admin/rocniky/${day.year.id}`,
                    },
                    {
                        label: "Program",
                        href: `/admin/rocniky/${day.year.id}/program`,
                    },
                    {
                        label: day.label,
                        href: `/admin/rocniky/${day.year.id}/program/${day.id}`,
                    },
                    { label: "Nová událost" },
                ]}
                title={`Nová událost — ${day.label}, ${formatDate(day.date)}`}
            />

            <ProgramEventForm
                mode="create"
                yearId={day.year.id}
                dayId={day.id}
                existingTags={existingTags}
            />
        </Container>
    );
}
