import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { InfoForm } from "@/components/forms/info-form";
import { PageHeader } from "@/components/admin/page-header";

interface NewInfoPageProps {
    params: Promise<{ id: string }>;
}

export default async function NewInfoPage({ params }: NewInfoPageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info", href: `/admin/rocniky/${year.id}/info` },
                    { label: "Nova info sekce" },
                ]}
                title="Nova info sekce"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <InfoForm mode="create" yearId={year.id} />
        </Container>
    );
}
