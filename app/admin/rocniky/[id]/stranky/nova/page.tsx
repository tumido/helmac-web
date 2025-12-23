import { Container, Typography, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageForm } from "@/components/forms/page-form";

interface NewPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        select: { id: true, year: true, title: true },
    });
}

export default async function NewPagePage({ params }: NewPageProps) {
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
                    href={`/admin/rocniky/${year.id}`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocnik {year.year}
                </Button>
                <Typography variant="h4">Nova stranka</Typography>
                <Typography color="text.secondary">
                    Rocnik {year.year} - {year.title}
                </Typography>
            </Box>

            <PageForm mode="create" yearId={year.id} />
        </Container>
    );
}
