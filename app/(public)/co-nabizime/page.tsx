import { Suspense } from "react";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { OffersContent } from "@/components/public/features/offers";
import { getOffersForActiveYear, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Co nabízíme | Helmac",
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
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <Suspense>
                    <OffersContent offers={offers} />
                </Suspense>
            </Container>
        </>
    );
}
