"use client";

import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { ProgramDay } from "./program.types";

interface DayTabsProps {
    days: ProgramDay[];
    selectedDayId: string;
    onDayChange: (dayId: string) => void;
}

function formatDayLabel(day: ProgramDay): string {
    const date = new Date(day.date);
    const weekday = date.toLocaleDateString("cs-CZ", { weekday: "short" });
    const dayNum = date.getDate();
    return `${day.label} - ${weekday} ${dayNum}`;
}

export function DayTabs({ days, selectedDayId, onDayChange }: DayTabsProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        onDayChange(newValue);
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
                value={selectedDayId}
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
                {days.map((day) => (
                    <Tab
                        key={day.id}
                        label={formatDayLabel(day)}
                        value={day.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
