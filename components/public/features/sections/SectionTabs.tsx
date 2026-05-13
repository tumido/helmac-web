"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { TabScrollButton } from "@/components/public/ui/TabScrollButton";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
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
                borderBottom: 0,
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
                    ml: { xs: -2, sm: -3 },
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
                        position: "relative",
                        overflow: "visible",
                        "& .MuiTouchRipple-root": {
                            display: "none",
                        },
                    },
                    "& .Mui-selected": {
                        color: "primary.main",
                    },
                    "& .MuiTabs-indicator": {
                        display: "none",
                    },
                    "& .MuiTabs-scroller": {
                        pb: 1,
                    },
                }}
            >
                {sections.map((section) => {
                    const isSelected =
                        section.id === selectedSectionId;
                    return (
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
                                <>
                                    {section.subtitle ? (
                                        <span>
                                            {section.title}
                                            <br />
                                            <span
                                                style={{
                                                    fontSize:
                                                        "0.75em",
                                                    fontWeight:
                                                        400,
                                                    opacity:
                                                        0.7,
                                                }}
                                            >
                                                {
                                                    section.subtitle
                                                }
                                            </span>
                                        </span>
                                    ) : (
                                        section.title
                                    )}
                                    <OrnamentalUnderline
                                        sx={{
                                            position:
                                                "absolute",
                                            bottom: 6,
                                            left: 8,
                                            right: 8,
                                            opacity:
                                                isSelected
                                                    ? 1
                                                    : 0,
                                            transition:
                                                "opacity 0.2s",
                                        }}
                                    />
                                </>
                            }
                            value={section.id}
                        />
                    );
                })}
            </Tabs>
        </Box>
    );
}
