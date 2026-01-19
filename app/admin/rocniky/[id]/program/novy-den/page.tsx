import { Container, Typography, Box } from "@mui/material";
import { ArrowBack, CalendarMonth } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { ProgramDayForm } from "@/components/forms/program-day-form";

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
            <Box sx={{ mb: 4 }}>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/program`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na program
                </LinkButton>
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
