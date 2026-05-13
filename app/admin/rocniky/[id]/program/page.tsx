import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getProgramDaysForYear } from "@/lib/services/program";
import { SortableDays } from "@/components/admin/sortable-days";
import { PageHeader } from "@/components/admin/page-header";

interface ProgramPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProgramPage({
    params,
}: ProgramPageProps) {
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
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${year.year}`,
                        href: `/admin/rocniky/${year.id}`,
                    },
                    { label: "Program" },
                ]}
                title="Program"
            />

            <SortableDays yearId={year.id} days={days} />
        </Container>
    );
}
