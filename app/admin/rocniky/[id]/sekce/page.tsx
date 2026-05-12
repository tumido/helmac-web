import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getSectionTypesForYear } from "@/lib/services/sections";
import { PageHeader } from "@/components/admin/page-header";
import { SectionTypesList } from "@/components/admin/section-types-list";

interface SekcePageProps {
    params: Promise<{ id: string }>;
}

export default async function SekcePage({
    params,
}: SekcePageProps) {
    const { id } = await params;
    const [year, sectionTypes] = await Promise.all([
        getYearById(id),
        getSectionTypesForYear(id),
    ]);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
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
                    { label: "Sekce" },
                ]}
                title="Sekce"
            />

            <SectionTypesList
                yearId={year.id}
                sectionTypes={sectionTypes.map((st) => ({
                    id: st.id,
                    label: st.label,
                    slug: st.slug,
                    icon: st.icon,
                    sortOrder: st.sortOrder,
                    pageTitle: st.pageTitle,
                    pageSubtitle: st.pageSubtitle,
                    metaTitle: st.metaTitle,
                    metaDescription: st.metaDescription,
                    sections: st.sections.map((s) => ({
                        id: s.id,
                        title: s.title,
                        icon: s.icon,
                    })),
                }))}
            />
        </Container>
    );
}
