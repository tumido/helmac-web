import { Box, Typography } from "@mui/material";
import { WbSunny, Brightness5, NightsStay } from "@mui/icons-material";
import { TimeOfDay, getTimeOfDayLabel } from "./program.types";

interface TimeSectionProps {
    timeOfDay: TimeOfDay;
    isFirst?: boolean;
}

function getTimeIcon(timeOfDay: TimeOfDay) {
    switch (timeOfDay) {
        case "morning":
            return <WbSunny sx={{ color: "primary.main" }} />;
        case "afternoon":
            return <Brightness5 sx={{ color: "primary.main" }} />;
        case "evening":
            return <NightsStay sx={{ color: "primary.main" }} />;
    }
}

export function TimeSection({ timeOfDay, isFirst }: TimeSectionProps) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
                mt: isFirst ? 0 : 4,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center" }}>
                {getTimeIcon(timeOfDay)}
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 600,
                        color: "primary.main",
                        pl: 1.5,
                    }}
                >
                    {getTimeOfDayLabel(timeOfDay)}
                </Typography>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "divider",
                    ml: 2,
                }}
            />
        </Box>
    );
}
