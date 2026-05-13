import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { ProgramDayForm } from "@/components/forms/program-day-form";
import { PageHeader } from "@/components/admin/page-header";

interface NewDayPageProps {
    params: Promise<{ id: string }>;
}

export default async function NewDayPage({
    params,
}: NewDayPageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="sm">
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
                    {
                        label: "Program",
                        href: `/admin/rocniky/${year.id}/program`,
                    },
                    { label: "Nový den" },
                ]}
                title="Nový den programu"
            />

            <ProgramDayForm
                mode="create"
                yearId={year.id}
            />
        </Container>
    );
}
