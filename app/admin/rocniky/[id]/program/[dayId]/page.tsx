import { Container, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getProgramDayWithEvents } from "@/lib/services/program";
import { ProgramDayForm } from "@/components/forms/program-day-form";
import { PageHeader } from "@/components/admin/page-header";
import { SortableEvents } from "@/components/admin/sortable-events";
import { formatDate } from "@/lib/utils/date";

interface EditDayPageProps {
    params: Promise<{ id: string; dayId: string }>;
}

export default async function EditDayPage({
    params,
}: EditDayPageProps) {
    const { id, dayId } = await params;
    const day = await getProgramDayWithEvents(dayId);

    if (!day || day.yearId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
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
                    { label: day.label },
                ]}
                title={`${day.label} — ${formatDate(day.date)}`}
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        lg: "1fr 1.5fr",
                    },
                    gap: 2,
                    alignItems: "start",
                }}
            >
                <ProgramDayForm
                    mode="edit"
                    yearId={day.year.id}
                    dayId={day.id}
                    defaultValues={{
                        date: day.date,
                        label: day.label,
                    }}
                />

                <SortableEvents
                    yearId={day.year.id}
                    dayId={day.id}
                    events={day.events}
                />
            </Box>
        </Container>
    );
}
