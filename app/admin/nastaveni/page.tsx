import { Container, Card, CardContent, Typography, Box } from "@mui/material";
import { Email, PrivacyTip } from "@mui/icons-material";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { requireAdmin } from "@/lib/auth";

export default async function NastaveniPage() {
    await requireAdmin();

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[{ label: "Nastavení" }]}
                title="Nastavení"
            />

            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <PrivacyTip color="action" />
                            <Box>
                                <Typography variant="h6">GDPR</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Správa obsahu stránky ochrany osobních údajů
                                </Typography>
                            </Box>
                        </Box>
                        <LinkButton href="/admin/nastaveni/gdpr" variant="outlined">
                            Upravit
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Email color="action" />
                            <Box>
                                <Typography variant="h6">Emailové účty</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Správa SMTP účtů pro odesílání emailů
                                </Typography>
                            </Box>
                        </Box>
                        <LinkButton href="/admin/nastaveni/emaily" variant="outlined">
                            Spravovat
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
