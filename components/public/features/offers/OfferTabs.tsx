"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { TabScrollButton } from "@/components/public/ui/TabScrollButton";
import { GameIcon } from "@/lib/icons";
import { OfferItem } from "./offers.types";

interface OfferTabsProps {
    offers: OfferItem[];
    selectedOfferId: string;
    onOfferChange: (offerId: string) => void;
}

export function OfferTabs({ offers, selectedOfferId, onOfferChange }: OfferTabsProps) {
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
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                ScrollButtonComponent={TabScrollButton}
                sx={{
                    "& .MuiTab-root": {
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 600,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
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
                {offers.map((offer) => (
                    <Tab
                        key={offer.id}
                        icon={offer.icon ? <GameIcon name={offer.icon} sx={{ fontSize: "1.5em" }} /> : undefined}
                        iconPosition="start"
                        label={
                            offer.subtitle ? (
                                <span>
                                    {offer.title}
                                    <br />
                                    <span style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.7 }}>
                                        {offer.subtitle}
                                    </span>
                                </span>
                            ) : (
                                offer.title
                            )
                        }
                        value={offer.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
