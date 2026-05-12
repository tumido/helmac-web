import { Suspense } from "react";
import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/public/ui";
import { SectionContent } from "@/components/public/features/sections";
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

    const { sectionType, year } = result;

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
                backgroundImage={
                    year?.headerPhoto || undefined
                }
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <Suspense>
                    <SectionContent
                        sections={
                            sectionType.sections as unknown as SectionItem[]
                        }
                    />
                </Suspense>
            </Container>
        </>
    );
}
