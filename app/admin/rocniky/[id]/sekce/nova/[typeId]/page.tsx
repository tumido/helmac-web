import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getSectionTypeById } from "@/lib/services/sections";
import { PageHeader } from "@/components/admin/page-header";
import { SectionForm } from "@/components/forms/section-form";

interface NovaSekcePageProps {
    params: Promise<{ id: string; typeId: string }>;
}

export default async function NovaSekce({
    params,
}: NovaSekcePageProps) {
    const { id, typeId } = await params;
    const [year, sectionType] = await Promise.all([
        getYearById(id),
        getSectionTypeById(typeId),
    ]);

    if (!year || !sectionType) {
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
                    {
                        label: `Nová sekce (${sectionType.label})`,
                    },
                ]}
                title={`Nová sekce – ${sectionType.label}`}
            />

            <SectionForm
                mode="create"
                yearId={year.id}
                sectionTypeId={sectionType.id}
                cancelHref={`/admin/rocniky/${year.id}/sekce`}
            />
        </Container>
    );
}
