import { Container, Typography, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { YearForm } from "@/components/forms/year-form";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
    });
}

export default async function EditYearPage({ params }: EditYearPageProps) {
    const { id } = await params;
    const year = await getYear(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href="/admin/rocniky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocniky
                </Button>
                <Typography variant="h4">
                    Upravit rocnik {year.year}
                </Typography>
            </Box>

            <YearForm
                mode="edit"
                yearId={year.id}
                defaultValues={{
                    year: year.year,
                    title: year.title,
                    subtitle: year.subtitle,
                    startDate: year.startDate,
                    endDate: year.endDate,
                }}
            />
        </Container>
    );
}
