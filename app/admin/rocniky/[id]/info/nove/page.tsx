import { Container, Typography, Box } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { InfoForm } from "@/components/forms/info-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info", href: `/admin/rocniky/${year.id}/info` },
                    { label: "Nova info sekce" },
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
                    <Typography variant="h4">Nova info sekce</Typography>
                </Box>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <InfoForm mode="create" yearId={year.id} />
        </Container>
    );
}
