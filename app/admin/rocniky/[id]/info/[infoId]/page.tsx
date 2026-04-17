import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getInfoSectionById } from "@/lib/services/info";
import { InfoForm } from "@/components/forms/info-form";
import { PageHeader } from "@/components/admin/page-header";

interface EditInfoPageProps {
    params: Promise<{ id: string; infoId: string }>;
}

export default async function EditInfoPage({ params }: EditInfoPageProps) {
    const { id, infoId } = await params;
    const [year, infoSection] = await Promise.all([
        getYearById(id),
        getInfoSectionById(infoId),
    ]);

    if (!year || !infoSection) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info", href: `/admin/rocniky/${year.id}/info` },
                    { label: infoSection.title },
                ]}
                title="Upravit info sekci"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <InfoForm
                mode="edit"
                yearId={year.id}
                infoId={infoSection.id}
                defaultValues={{
                    title: infoSection.title,
                    content: infoSection.content,
                    showToc: infoSection.showToc,
                }}
            />
        </Container>
    );
}
