import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { PageContent } from "@/components/public/features/pages";
import { getPageBySlugForActiveYear } from "@/lib/services";

export const metadata = {
    title: "Pravidla | Helmac",
    description: "Pravidla akce Helmac - hernl pravidla a pokyny pro ucastniky",
};

export default async function PravidlaPage() {
    const page = await getPageBySlugForActiveYear("pravidla");

    if (!page) {
        notFound();
    }

    return (
        <>
            <PageHeader
                title={page.title}
                subtitle={page.seoDesc || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <PageContent content={page.content} />
            </Container>
        </>
    );
}
