import { Box, Typography } from "@mui/material";
import { WbSunny, Brightness5, NightsStay } from "@mui/icons-material";
import { TimeOfDay, getTimeOfDayLabel } from "./program.types";

interface TimeSectionProps {
    timeOfDay: TimeOfDay;
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

export function TimeSection({ timeOfDay }: TimeSectionProps) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
                mt: 4,
                "&:first-of-type": {
                    mt: 0,
                },
            }}
        >
            <div className="mt-4 flex flex-row">
                {getTimeIcon(timeOfDay)}
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 600,
                        color: "primary.main",
                        paddingLeft: "15px",
                    }}
                >
                    {getTimeOfDayLabel(timeOfDay)}
                </Typography>
            </div>
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
