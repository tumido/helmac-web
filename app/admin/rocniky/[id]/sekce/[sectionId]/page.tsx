import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getSectionById } from "@/lib/services/sections";
import { PageHeader } from "@/components/admin/page-header";
import { SectionForm } from "@/components/forms/section-form";
import type { ContentBlock } from "@/lib/types/content-blocks";

interface EditSekcePageProps {
    params: Promise<{ id: string; sectionId: string }>;
}

export default async function EditSekce({
    params,
}: EditSekcePageProps) {
    const { id, sectionId } = await params;
    const [year, section] = await Promise.all([
        getYearById(id),
        getSectionById(sectionId),
    ]);

    if (!year || !section) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${year.year}`,
                        href: `/admin/rocniky/${year.id}`,
                    },
                    {
                        label: "Sekce",
                        href: `/admin/rocniky/${year.id}/sekce`,
                    },
                    { label: section.title },
                ]}
                title="Upravit sekci"
            />

            <SectionForm
                mode="edit"
                yearId={year.id}
                sectionTypeId={section.sectionType.id}
                sectionId={section.id}
                cancelHref={`/admin/rocniky/${year.id}/sekce`}
                defaultValues={{
                    title: section.title,
                    subtitle: section.subtitle,
                    content:
                        section.content as unknown as ContentBlock[],
                    showToc: section.showToc,
                    icon: section.icon,
                }}
            />
        </Container>
    );
}
