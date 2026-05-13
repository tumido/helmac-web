import { Suspense } from "react";
import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/public/ui";
import { SectionContent, SectionTabsNav } from "@/components/public/features/sections";
import { getSectionTypeBySlugForActiveYear } from "@/lib/services/sections";
import type { Metadata } from "next";
import type { SectionItem } from "@/components/public/features/sections";

interface SectionPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: SectionPageProps): Promise<Metadata> {
    const { slug } = await params;
    const result =
        await getSectionTypeBySlugForActiveYear(slug);
    if (!result) return {};
    const { sectionType } = result;
    return {
        title:
            sectionType.metaTitle ||
            `${sectionType.label} | Helmáč`,
        description:
            sectionType.metaDescription || undefined,
    };
}

export default async function SectionPage({
    params,
}: SectionPageProps) {
    const { slug } = await params;
    const result =
        await getSectionTypeBySlugForActiveYear(slug);

    if (!result) {
        notFound();
    }

    const { sectionType } = result;
    const sections = sectionType.sections as unknown as SectionItem[];

    return (
        <>
            <PageHeader
                title={
                    sectionType.pageTitle ||
                    sectionType.label
                }
                subtitle={
                    sectionType.pageSubtitle || undefined
                }
                icon={sectionType.icon || undefined}
            >
                {sections.length > 1 && (
                    <Suspense>
                        <SectionTabsNav sections={sections} />
                    </Suspense>
                )}
            </PageHeader>
            <Container
                maxWidth="lg"
                sx={{ position: "relative", pb: 8 }}
            >
                <Suspense>
                    <SectionContent sections={sections} />
                </Suspense>
            </Container>
        </>
    );
}
