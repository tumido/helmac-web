import { Container, Typography, Box } from "@mui/material";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

async function getYears() {
    return db.year.findMany({
        where: { isArchived: false },
        orderBy: { year: "desc" },
        select: { id: true, year: true, title: true },
    });
}

interface NewAlbumPageProps {
    searchParams: Promise<{ yearId?: string }>;
}

export default async function NewAlbumPage({ searchParams }: NewAlbumPageProps) {
    const { yearId } = await searchParams;
    const years = await getYears();

    if (years.length === 0) {
        redirect("/admin/rocniky/novy");
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Galerie", href: "/admin/galerie" },
                    { label: "Nove album" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4">Nove album</Typography>
            </Box>

            <AlbumForm mode="create" years={years} defaultValues={yearId ? { yearId } : undefined} />
        </Container>
    );
}
