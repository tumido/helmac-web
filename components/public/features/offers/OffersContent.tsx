"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { OfferTabs } from "./OfferTabs";
import { OfferItem } from "./offers.types";
import { ContentWithToc } from "@/components/public/features/toc";

interface OffersContentProps {
    offers: OfferItem[];
}

export function OffersContent({ offers }: OffersContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const selectedOfferId = (tabParam && offers.some((o) => o.id === tabParam))
        ? tabParam
        : offers[0]?.id || "";

    const handleOfferChange = (offerId: string) => {
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
            <ContentWithToc content={selectedOffer.content} showToc={selectedOffer.showToc} />
        </Box>
    );
}
