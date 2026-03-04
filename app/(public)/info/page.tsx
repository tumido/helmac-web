import { Suspense } from "react";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { InfoContent } from "@/components/public/features/info";
import { getInfoSectionsForActiveYear, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Info | Helmac",
    description: "Důležité informace pro účastníky akce Helmac",
};

export default async function InfoPage() {
    const [infoSections, activeYear] = await Promise.all([
        getInfoSectionsForActiveYear(),
        getActiveYear(),
    ]);

    return (
        <>
            <PageHeader
                title="Informace"
                subtitle="Důležité informace pro účastníky"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <Suspense>
                    <InfoContent infoSections={infoSections} />
                </Suspense>
            </Container>
        </>
    );
}
