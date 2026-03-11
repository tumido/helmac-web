import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AlbumForm } from "@/components/forms/album-form";
import { PageHeader } from "@/components/admin/page-header";

interface YearNewAlbumPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        select: { id: true, year: true, title: true },
    });
}

export default async function YearNewAlbumPage({ params }: YearNewAlbumPageProps) {
    const { id } = await params;
    const year = await getYear(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Galerie", href: `/admin/rocniky/${year.id}/galerie` },
                    { label: "Nové album" },
                ]}
                title="Nové album"
            />

            <AlbumForm
                mode="create"
                years={[year]}
                defaultValues={{ yearId: year.id }}
                hideYearSelect
                cancelHref={`/admin/rocniky/${id}/galerie`}
                redirectTo={`/admin/rocniky/${id}/galerie`}
            />
        </Container>
    );
}
