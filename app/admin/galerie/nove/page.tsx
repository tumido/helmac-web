import { Container } from "@mui/material";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { PageHeader } from "@/components/admin/page-header";

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
            <PageHeader
                breadcrumbs={[
                    { label: "Galerie", href: "/admin/galerie" },
                    { label: "Nove album" },
                ]}
                title="Nove album"
            />

            <AlbumForm mode="create" years={years} defaultValues={yearId ? { yearId } : undefined} />
        </Container>
    );
}
