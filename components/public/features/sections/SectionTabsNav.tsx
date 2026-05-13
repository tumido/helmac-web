"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SectionTabs } from "./SectionTabs";
import { SectionItem } from "./section.types";

interface SectionTabsNavProps {
    sections: SectionItem[];
}

export function SectionTabsNav({ sections }: SectionTabsNavProps) {
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

    if (sections.length <= 1) return null;

    return (
        <SectionTabs
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSectionChange={handleSectionChange}
        />
    );
}
