import { Suspense } from "react";
import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/public/ui";
import { SectionContent, SectionTabsNav } from "@/components/public/features/sections";
import { getSectionTypeBySlugForActiveYear } from "@/lib/services/sections";
import { getFilteredRegistrationStats } from "@/lib/services/registration";
import type { RegistrationStats } from "@/lib/services/registration";
import { extractStatBlocks } from "@/lib/types/content-blocks";
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
    const sections = sectionType.sections as unknown as SectionItem[];

    const allStatBlocks = sections.flatMap((s) =>
        Array.isArray(s.content)
            ? extractStatBlocks(s.content)
            : []
    );
    let stats: Record<string, RegistrationStats> | undefined;
    if (allStatBlocks.length > 0) {
        const entries = await Promise.all(
            allStatBlocks.map(async (b) =>
                [
                    b.id,
                    await getFilteredRegistrationStats(
                        year.id,
                        b.filter
                    ),
                ] as const
            )
        );
        stats = Object.fromEntries(entries);
    }

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
                    <SectionContent sections={sections} stats={stats} />
                </Suspense>
            </Container>
        </>
    );
}
