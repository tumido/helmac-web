"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { TabScrollButton } from "@/components/public/ui/TabScrollButton";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
interface DayTabsProps {
    days: { id: string; label: string }[];
    selectedDayId: string;
    onDayChange: (dayId: string) => void;
}

export function DayTabs({ days, selectedDayId, onDayChange }: DayTabsProps) {
    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        onDayChange(newValue);
    };

    return (
        <Box
            sx={{
                borderBottom: 0,
                mb: 3,
            }}
        >
            <Tabs
                value={selectedDayId}
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
                            xs: "1rem",
                            sm: "1.1rem",
                        },
                        textTransform: "none",
                        minWidth: { xs: "auto", sm: 120 },
                        minHeight: 64,
                        px: { xs: 2, sm: 3 },
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
                {days.map((day) => {
                    const isSelected = day.id === selectedDayId;
                    return (
                        <Tab
                            key={day.id}
                            label={
                                <>
                                    {day.label}
                                    <OrnamentalUnderline
                                        sx={{
                                            position: "absolute",
                                            bottom: 6,
                                            left: 8,
                                            right: 8,
                                            opacity: isSelected
                                                ? 1
                                                : 0,
                                            transition:
                                                "opacity 0.2s",
                                        }}
                                    />
                                </>
                            }
                            value={day.id}
                        />
                    );
                })}
            </Tabs>
        </Box>
    );
}
