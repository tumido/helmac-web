import { Suspense } from "react";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { RulesContent } from "@/components/public/features/rules";
import { getRulesForActiveYear, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Pravidla | Helmac",
    description: "Pravidla akce Helmac - herní pravidla a pokyny pro účastníky",
};

export default async function PravidlaPage() {
    const [rules, activeYear] = await Promise.all([
        getRulesForActiveYear(),
        getActiveYear(),
    ]);

    return (
        <>
            <PageHeader
                title="Pravidla"
                subtitle="Herní pravidla a pokyny pro účastníky"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <Suspense>
                    <RulesContent rules={rules} />
                </Suspense>
            </Container>
        </>
    );
}
