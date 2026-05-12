import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getRuleById } from "@/lib/services/rules";
import { RuleForm } from "@/components/forms/rule-form";
import { PageHeader } from "@/components/admin/page-header";
import type { ContentBlock } from "@/lib/types/content-blocks";

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
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Pravidla", href: `/admin/rocniky/${year.id}/pravidla` },
                    { label: rule.title },
                ]}
                title="Upravit pravidlo"
            />
            <RuleForm
                mode="edit"
                yearId={year.id}
                ruleId={rule.id}
                defaultValues={{
                    title: rule.title,
                    subtitle: rule.subtitle,
                    content: rule.content as unknown as ContentBlock[],
                    showToc: rule.showToc,
                    icon: rule.icon,
                }}
            />
        </Container>
    );
}
