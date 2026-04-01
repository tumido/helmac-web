"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { InfoTabs, type ExtraTab } from "./InfoTabs";
import { InfoItem } from "./info.types";

interface InfoContentProps {
    infoSections: InfoItem[];
    statsContent?: React.ReactNode;
}

const STATS_TAB_ID = "__stats__";

export function InfoContent({ infoSections, statsContent }: InfoContentProps) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const allTabIds = [
        ...infoSections.map((i) => i.id),
        ...(statsContent ? [STATS_TAB_ID] : []),
    ];

    const initialId = (tabParam && allTabIds.includes(tabParam))
        ? tabParam
        : infoSections[0]?.id || "";

    const [selectedInfoId, setSelectedInfoId] = useState(initialId);

    useEffect(() => {
        if (tabParam && allTabIds.includes(tabParam)) {
            setSelectedInfoId(tabParam);
        }
    }, [tabParam]);

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
                onInfoChange={setSelectedInfoId}
                extraTabs={extraTabs}
            />
            {isStatsTab ? (
                <Box>{statsContent}</Box>
            ) : selectedInfo ? (
                <Typography
                    variant="body1"
                    component="div"
                    sx={{
                        "& p": { mb: 2 },
                        "& h2": {
                            fontSize: "1.5rem",
                            fontWeight: 600,
                            mt: 3,
                            mb: 1,
                        },
                        "& h3": {
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            mt: 2,
                            mb: 1,
                        },
                        "& ul, & ol": {
                            pl: 3,
                            mb: 2,
                        },
                        "& blockquote": {
                            borderLeft: "4px solid",
                            borderColor: "divider",
                            pl: 2,
                            ml: 0,
                            fontStyle: "italic",
                            color: "text.secondary",
                        },
                        "& a": {
                            color: "primary.main",
                            textDecoration: "underline",
                        },
                        "& img": {
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: 2,
                            my: 2,
                        },
                        "& table": {
                            display: "block",
                            overflowX: "auto",
                        },
                        "& pre": {
                            overflowX: "auto",
                        },
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                        lineHeight: 1.8,
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedInfo.content }}
                />
            ) : null}
        </Box>
    );
}
