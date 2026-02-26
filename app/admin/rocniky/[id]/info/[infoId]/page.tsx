import { Container, Typography, Box } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getInfoSectionById } from "@/lib/services/info";
import { InfoForm } from "@/components/forms/info-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info", href: `/admin/rocniky/${year.id}/info` },
                    { label: infoSection.title },
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
                    <InfoOutlined sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Upravit info sekci</Typography>
                </Box>
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
                }}
            />
        </Container>
    );
}
