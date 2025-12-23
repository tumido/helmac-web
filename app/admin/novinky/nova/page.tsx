import { Container, Typography, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NewsForm } from "@/components/forms/news-form";

async function getYears() {
    return db.year.findMany({
        where: { isArchived: false },
        orderBy: { year: "desc" },
        select: { id: true, year: true, title: true },
    });
}

export default async function NewNewsPage() {
    const years = await getYears();

    if (years.length === 0) {
        redirect("/admin/rocniky/novy");
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href="/admin/novinky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na novinky
                </Button>
                <Typography variant="h4">Nova novinka</Typography>
            </Box>

            <NewsForm mode="create" years={years} />
        </Container>
    );
}
