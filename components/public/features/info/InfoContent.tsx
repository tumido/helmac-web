"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { InfoTabs, type ExtraTab } from "./InfoTabs";
import { InfoItem } from "./info.types";
import { ContentWithToc } from "@/components/public/features/toc";

interface InfoContentProps {
    infoSections: InfoItem[];
    statsContent?: React.ReactNode;
}

const STATS_TAB_ID = "__stats__";

export function InfoContent({ infoSections, statsContent }: InfoContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const allTabIds = [
        ...infoSections.map((i) => i.id),
        ...(statsContent ? [STATS_TAB_ID] : []),
    ];

    const selectedInfoId = (tabParam && allTabIds.includes(tabParam))
        ? tabParam
        : infoSections[0]?.id || "";

    const handleInfoChange = (infoId: string) => {
        router.replace(`${pathname}?tab=${infoId}`, { scroll: false });
    };

    if (infoSections.length === 0 && !statsContent) {
        return (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Zatim nebyly pridany zadne informace.
            </Typography>
        );
    }

    const extraTabs: ExtraTab[] = statsContent
        ? [{ id: STATS_TAB_ID, title: "Statistiky" }]
        : [];

    const isStatsTab = selectedInfoId === STATS_TAB_ID;
    const selectedInfo = infoSections.find((i) => i.id === selectedInfoId) || infoSections[0];

    return (
        <Box>
            <InfoTabs
                infoSections={infoSections}
                selectedInfoId={isStatsTab ? STATS_TAB_ID : selectedInfo?.id ?? ""}
                onInfoChange={handleInfoChange}
                extraTabs={extraTabs}
            />
            {isStatsTab ? (
                <Box>{statsContent}</Box>
            ) : selectedInfo ? (
                <ContentWithToc html={selectedInfo.content} showToc={selectedInfo.showToc} />
            ) : null}
        </Box>
    );
}
