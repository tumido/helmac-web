"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { InfoItem } from "./info.types";

export interface ExtraTab {
    id: string;
    title: string;
}

interface InfoTabsProps {
    infoSections: InfoItem[];
    selectedInfoId: string;
    onInfoChange: (infoId: string) => void;
    extraTabs?: ExtraTab[];
}

export function InfoTabs({ infoSections, selectedInfoId, onInfoChange, extraTabs }: InfoTabsProps) {
    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        onInfoChange(newValue);
    };

    return (
        <Box
            sx={{
                borderBottom: 1,
                borderColor: "divider",
                mb: 3,
            }}
        >
            <Tabs
                value={selectedInfoId}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    "& .MuiTab-root": {
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 600,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        textTransform: "none",
                        minWidth: { xs: "auto", sm: 120 },
                        px: { xs: 2, sm: 3 },
                    },
                    "& .Mui-selected": {
                        color: "primary.main",
                    },
                    "& .MuiTabs-indicator": {
                        backgroundColor: "primary.main",
                        height: 3,
                    },
                }}
            >
                {infoSections.map((info) => (
                    <Tab
                        key={info.id}
                        label={info.title}
                        value={info.id}
                    />
                ))}
                {extraTabs?.map((tab) => (
                    <Tab
                        key={tab.id}
                        label={tab.title}
                        value={tab.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
