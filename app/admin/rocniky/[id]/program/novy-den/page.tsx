import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { ProgramDayForm } from "@/components/forms/program-day-form";
import { PageHeader } from "@/components/admin/page-header";

interface NewDayPageProps {
    params: Promise<{ id: string }>;
}

export default async function NewDayPage({ params }: NewDayPageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="sm">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Program", href: `/admin/rocniky/${year.id}/program` },
                    { label: "Novy den" },
                ]}
                title="Novy den programu"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <ProgramDayForm mode="create" yearId={year.id} />
        </Container>
    );
}
