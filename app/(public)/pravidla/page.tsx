import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { RulesContent } from "@/components/public/features/rules";
import { getRulesForActiveYear } from "@/lib/services";

export const metadata = {
    title: "Pravidla | Helmac",
    description: "Pravidla akce Helmac - herni pravidla a pokyny pro ucastniky",
};

export default async function PravidlaPage() {
    const rules = await getRulesForActiveYear();

    return (
        <>
            <PageHeader title="Pravidla" />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <RulesContent rules={rules} />
            </Container>
        </>
    );
}
