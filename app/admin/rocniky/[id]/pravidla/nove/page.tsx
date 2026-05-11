import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { RuleForm } from "@/components/forms/rule-form";
import { PageHeader } from "@/components/admin/page-header";

interface NewRulePageProps {
    params: Promise<{ id: string }>;
}

export default async function NewRulePage({ params }: NewRulePageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Pravidla", href: `/admin/rocniky/${year.id}/pravidla` },
                    { label: "Nové pravidlo" },
                ]}
                title="Nové pravidlo"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <RuleForm mode="create" yearId={year.id} />
        </Container>
    );
}
