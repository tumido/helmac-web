"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { OfferTabs } from "./OfferTabs";
import { OfferItem } from "./offers.types";

interface OffersContentProps {
    offers: OfferItem[];
}

export function OffersContent({ offers }: OffersContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const initialId = (tabParam && offers.some((o) => o.id === tabParam))
        ? tabParam
        : offers[0]?.id || "";

    const [selectedOfferId, setSelectedOfferId] = useState(initialId);

    useEffect(() => {
        if (tabParam && offers.some((o) => o.id === tabParam)) {
            setSelectedOfferId(tabParam);
        }
    }, [tabParam]);

    const handleOfferChange = (offerId: string) => {
        setSelectedOfferId(offerId);
        router.replace(`${pathname}?tab=${offerId}`, { scroll: false });
    };

    if (offers.length === 0) {
        return (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Zatím nebyly přidány žádné nabídky.
            </Typography>
        );
    }

    const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0];

    return (
        <Box>
            <OfferTabs
                offers={offers}
                selectedOfferId={selectedOffer.id}
                onOfferChange={handleOfferChange}
            />
            <Typography
                variant="body1"
                component="div"
                sx={{
                    "& p": { mb: 2 },
                    "& h2": {
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        mt: 3,
                        mb: 1,
                    },
                    "& h3": {
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        mt: 2,
                        mb: 1,
                    },
                    "& ul, & ol": {
                        pl: 3,
                        mb: 2,
                    },
                    "& ul": { listStyleType: "disc" },
                    "& ol": { listStyleType: "decimal" },
                    "& blockquote": {
                        borderLeft: "4px solid",
                        borderColor: "divider",
                        pl: 2,
                        ml: 0,
                        fontStyle: "italic",
                        color: "text.secondary",
                    },
                    "& a": {
                        color: "primary.main",
                        textDecoration: "underline",
                    },
                    "& img": {
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: 2,
                        my: 2,
                    },
                    "& table": {
                        display: "block",
                        overflowX: "auto",
                    },
                    "& pre": {
                        overflowX: "auto",
                    },
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: selectedOffer.content }}
            />
        </Box>
    );
}
