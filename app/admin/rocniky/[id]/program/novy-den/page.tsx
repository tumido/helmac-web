import { Container, Typography, Box } from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { ProgramDayForm } from "@/components/forms/program-day-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Program", href: `/admin/rocniky/${year.id}/program` },
                    { label: "Novy den" },
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
                    <CalendarMonth sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Novy den programu</Typography>
                </Box>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <ProgramDayForm mode="create" yearId={year.id} />
        </Container>
    );
}
