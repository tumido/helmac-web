import { Container, Typography, Box } from "@mui/material";
import { Gavel } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { RuleForm } from "@/components/forms/rule-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

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
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Pravidla", href: `/admin/rocniky/${year.id}/pravidla` },
                    { label: "Nove pravidlo" },
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
                    <Typography variant="h4">Nove pravidlo</Typography>
                </Box>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <RuleForm mode="create" yearId={year.id} />
        </Container>
    );
}
