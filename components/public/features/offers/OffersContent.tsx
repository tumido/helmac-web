"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { OfferTabs } from "./OfferTabs";
import { OfferItem } from "./offers.types";
import { richContentSx } from "@/lib/utils/rich-content-sx";

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
                sx={richContentSx}
                dangerouslySetInnerHTML={{ __html: selectedOffer.content }}
            />
        </Box>
    );
}
