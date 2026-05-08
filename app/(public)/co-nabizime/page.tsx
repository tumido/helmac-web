import { Suspense } from "react";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { OffersContent } from "@/components/public/features/offers";
import { getOffersForActiveYear, getActiveYear } from "@/lib/services";
import type { OfferItem } from "@/components/public/features/offers";

export const metadata = {
    title: "Co nabízíme | Helmáč",
    description: "Co vám naše akce nabízí",
};

export default async function CoNabizimePage() {
    const [offers, activeYear] = await Promise.all([
        getOffersForActiveYear(),
        getActiveYear(),
    ]);

    return (
        <>
            <PageHeader
                title="Co nabízíme"
                subtitle="Co vám naše akce nabízí"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <Suspense>
                    <OffersContent offers={offers as unknown as OfferItem[]} />
                </Suspense>
            </Container>
        </>
    );
}
