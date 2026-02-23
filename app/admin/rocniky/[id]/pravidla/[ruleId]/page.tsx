import { Container, Typography, Box } from "@mui/material";
import { Gavel } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getRuleById } from "@/lib/services/rules";
import { RuleForm } from "@/components/forms/rule-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Pravidla", href: `/admin/rocniky/${year.id}/pravidla` },
                    { label: rule.title },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Gavel sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Upravit pravidlo</Typography>
                </Box>
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
                    sortOrder: rule.sortOrder,
                }}
            />
        </Container>
    );
}
