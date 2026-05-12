"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { SectionTabs } from "./SectionTabs";
import { SectionItem } from "./section.types";
import { ContentWithToc } from "@/components/public/features/toc";

interface SectionContentProps {
    sections: SectionItem[];
    emptyMessage?: string;
}

export function SectionContent({
    sections,
    emptyMessage = "Zatím nebyly přidány žádné sekce.",
}: SectionContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const selectedSectionId =
        tabParam && sections.some((s) => s.id === tabParam)
            ? tabParam
            : sections[0]?.id || "";

    const handleSectionChange = (sectionId: string) => {
        router.replace(`${pathname}?tab=${sectionId}`, {
            scroll: false,
        });
    };

    if (sections.length === 0) {
        return (
            <Typography
                color="text.secondary"
                textAlign="center"
                sx={{ py: 4 }}
            >
                {emptyMessage}
            </Typography>
        );
    }

    const selectedSection =
        sections.find((s) => s.id === selectedSectionId) ||
        sections[0];

    return (
        <Box>
            <SectionTabs
                sections={sections}
                selectedSectionId={selectedSection.id}
                onSectionChange={handleSectionChange}
            />
            <ContentWithToc
                content={selectedSection.content}
                showToc={selectedSection.showToc}
            />
        </Box>
    );
}
