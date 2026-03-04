"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { Edit, LocalOffer } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { OfferActions } from "@/components/admin/offer-actions";
import { reorderOffers } from "@/lib/actions/offers";
import { useToast } from "@/lib/hooks/use-toast";

interface Offer {
    id: string;
    title: string;
}

interface SortableOffersProps {
    yearId: string;
    offers: Offer[];
}

export function SortableOffers({ yearId, offers }: SortableOffersProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderOffers(yearId, newOrder);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí nabídek bylo změněno");
        }
    };

    return (
        <SortableList
            items={offers}
            getId={(offer) => offer.id}
            onReorder={handleReorder}
            renderItem={(offer) => (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                        py: 1,
                        pr: 1,
                    }}
                >
                    <LocalOffer sx={{ color: "text.disabled" }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="medium">
                            {offer.title}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="Upravit nabídku">
                            <IconLinkButton
                                href={`/admin/rocniky/${yearId}/nabidka/${offer.id}`}
                                size="small"
                            >
                                <Edit />
                            </IconLinkButton>
                        </Tooltip>
                        <OfferActions
                            offerId={offer.id}
                            offerTitle={offer.title}
                        />
                    </Box>
                </Box>
            )}
        />
    );
}
