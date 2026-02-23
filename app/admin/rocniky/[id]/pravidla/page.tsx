import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Chip,
    Tooltip,
    Divider,
} from "@mui/material";
import {
    Edit,
    Add,
    Gavel,
} from "@mui/icons-material";
import { LinkButton, IconLinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getRulesForYear } from "@/lib/services/rules";
import { RuleActions } from "@/components/admin/rule-actions";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

interface PravidlaPageProps {
    params: Promise<{ id: string }>;
}

export default async function PravidlaPage({ params }: PravidlaPageProps) {
    const { id } = await params;
    const [year, rules] = await Promise.all([
        getYearById(id),
        getRulesForYear(id),
    ]);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Pravidla" },
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
                    <Typography variant="h4">Pravidla</Typography>
                </Box>
                <Typography color="text.secondary">
                    {year.year} - {year.title}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography variant="h6">Sekce pravidel</Typography>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/pravidla/nove`}
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                >
                    Pridat pravidlo
                </LinkButton>
            </Box>

            {rules.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyla vytvorena zadna pravidla.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    {rules.map((rule, index) => (
                        <Box key={rule.id}>
                            {index > 0 && <Divider />}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: 2,
                                }}
                            >
                                <Gavel sx={{ color: "text.disabled" }} />
                                <Box sx={{ flex: 1 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Typography fontWeight="medium">
                                            {rule.title}
                                        </Typography>
                                        <Chip
                                            label={`Poradi: ${rule.sortOrder}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                >
                                    <Tooltip title="Upravit pravidlo">
                                        <IconLinkButton
                                            href={`/admin/rocniky/${year.id}/pravidla/${rule.id}`}
                                            size="small"
                                        >
                                            <Edit />
                                        </IconLinkButton>
                                    </Tooltip>
                                    <RuleActions
                                        ruleId={rule.id}
                                        ruleTitle={rule.title}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Card>
            )}
        </Container>
    );
}
