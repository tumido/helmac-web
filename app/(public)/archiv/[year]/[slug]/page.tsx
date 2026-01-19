import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowBack } from "@mui/icons-material";
import { PageHeader } from "@/components/public/ui";
import { PageContent } from "@/components/public/features/pages";
import { getYearByNumber, getPublishedPageBySlug } from "@/lib/services";

interface ArchivePageDetailProps {
    params: Promise<{ year: string; slug: string }>;
}

export async function generateMetadata({ params }: ArchivePageDetailProps) {
    const { year: yearParam, slug } = await params;
    const yearNumber = parseInt(yearParam, 10);
    const year = await getYearByNumber(yearNumber);

    if (!year) {
        return { title: "Stranka nenalezena | Helmac" };
    }

    const page = await getPublishedPageBySlug(year.id, slug);

    if (!page) {
        return { title: "Stranka nenalezena | Helmac" };
    }

    return {
        title: `${page.title} | ${year.title} | Archiv | Helmac`,
        description: page.seoDesc || undefined,
    };
}

export default async function ArchivePageDetail({
    params,
}: ArchivePageDetailProps) {
    const { year: yearParam, slug } = await params;
    const yearNumber = parseInt(yearParam, 10);

    if (isNaN(yearNumber)) {
        notFound();
    }

    const year = await getYearByNumber(yearNumber);

    if (!year) {
        notFound();
    }

    const page = await getPublishedPageBySlug(year.id, slug);

    if (!page) {
        notFound();
    }

    return (
        <>
            <PageHeader
                title={page.title}
                subtitle={`${year.title} (${year.year})`}
            />

            <Container maxWidth="md" sx={{ pb: 8 }}>
                <LinkButton
                    href={`/archiv/${year.year}`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 4 }}
                >
                    Zpet na rocnik {year.year}
                </LinkButton>

                <PageContent content={page.content} />
            </Container>
        </>
    );
}
