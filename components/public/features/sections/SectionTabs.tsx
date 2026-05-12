"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { TabScrollButton } from "@/components/public/ui/TabScrollButton";
import { GameIcon } from "@/lib/icons";
import { SectionItem } from "./section.types";

interface SectionTabsProps {
    sections: SectionItem[];
    selectedSectionId: string;
    onSectionChange: (sectionId: string) => void;
}

export function SectionTabs({
    sections,
    selectedSectionId,
    onSectionChange,
}: SectionTabsProps) {
    const handleChange = (
        _event: React.SyntheticEvent,
        newValue: string
    ) => {
        onSectionChange(newValue);
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
                value={selectedSectionId}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                ScrollButtonComponent={TabScrollButton}
                sx={{
                    "& .MuiTab-root": {
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 600,
                        fontSize: {
                            xs: "0.875rem",
                            sm: "1rem",
                        },
                        textTransform: "none",
                        minWidth: { xs: "auto", sm: 120 },
                        px: { xs: 2, sm: 3 },
                        gap: 1.5,
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
                {sections.map((section) => (
                    <Tab
                        key={section.id}
                        icon={
                            section.icon ? (
                                <GameIcon
                                    name={section.icon}
                                    sx={{
                                        fontSize: "1.5em",
                                    }}
                                />
                            ) : undefined
                        }
                        iconPosition="start"
                        label={
                            section.subtitle ? (
                                <span>
                                    {section.title}
                                    <br />
                                    <span
                                        style={{
                                            fontSize:
                                                "0.75em",
                                            fontWeight: 400,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {section.subtitle}
                                    </span>
                                </span>
                            ) : (
                                section.title
                            )
                        }
                        value={section.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
