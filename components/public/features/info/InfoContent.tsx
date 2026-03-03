"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { InfoTabs } from "./InfoTabs";
import { InfoItem } from "./info.types";

interface InfoContentProps {
    infoSections: InfoItem[];
}

export function InfoContent({ infoSections }: InfoContentProps) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const initialId = (tabParam && infoSections.some((i) => i.id === tabParam))
        ? tabParam
        : infoSections[0]?.id || "";

    const [selectedInfoId, setSelectedInfoId] = useState(initialId);

    if (infoSections.length === 0) {
        return (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Zatim nebyly pridany zadne informace.
            </Typography>
        );
    }

    const selectedInfo = infoSections.find((i) => i.id === selectedInfoId) || infoSections[0];

    return (
        <Box>
            <InfoTabs
                infoSections={infoSections}
                selectedInfoId={selectedInfo.id}
                onInfoChange={setSelectedInfoId}
            />
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
        </Box>
    );
}
