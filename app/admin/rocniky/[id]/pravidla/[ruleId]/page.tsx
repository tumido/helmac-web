import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getRuleById } from "@/lib/services/rules";
import { RuleForm } from "@/components/forms/rule-form";
import { PageHeader } from "@/components/admin/page-header";

interface EditRulePageProps {
    params: Promise<{ id: string; ruleId: string }>;
}

export default async function EditRulePage({ params }: EditRulePageProps) {
    const { id, ruleId } = await params;
    const [year, rule] = await Promise.all([
        getYearById(id),
        getRuleById(ruleId),
    ]);

    if (!year || !rule) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Pravidla", href: `/admin/rocniky/${year.id}/pravidla` },
                    { label: rule.title },
                ]}
                title="Upravit pravidlo"
            />
            <Box sx={{ mb: 4 }}>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <RuleForm
                mode="edit"
                yearId={year.id}
                ruleId={rule.id}
                defaultValues={{
                    title: rule.title,
                    content: rule.content,
                    showToc: rule.showToc,
                    icon: rule.icon,
                }}
            />
        </Container>
    );
}
