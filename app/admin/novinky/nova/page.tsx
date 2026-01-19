import { Container, Typography, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
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
                <LinkButton
                    href="/admin/novinky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na novinky
                </LinkButton>
                <Typography variant="h4">Nova novinka</Typography>
            </Box>

            <NewsForm mode="create" years={years} />
        </Container>
    );
}
