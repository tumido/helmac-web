"use client";

import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { OfferItem } from "./offers.types";

interface OfferTabsProps {
    offers: OfferItem[];
    selectedOfferId: string;
    onOfferChange: (offerId: string) => void;
}

export function OfferTabs({ offers, selectedOfferId, onOfferChange }: OfferTabsProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        onOfferChange(newValue);
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
                value={selectedOfferId}
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
                {offers.map((offer) => (
                    <Tab
                        key={offer.id}
                        label={offer.title}
                        value={offer.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
