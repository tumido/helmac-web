"use client";

import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { InfoItem } from "./info.types";

interface InfoTabsProps {
    infoSections: InfoItem[];
    selectedInfoId: string;
    onInfoChange: (infoId: string) => void;
}

export function InfoTabs({ infoSections, selectedInfoId, onInfoChange }: InfoTabsProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
                centered={!isMobile}
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
            </Tabs>
        </Box>
    );
}
