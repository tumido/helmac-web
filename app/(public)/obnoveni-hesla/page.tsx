import { Container, Typography } from "@mui/material";
import { PageHeader, Card } from "@/components/public/ui";
import { NewPasswordForm } from "@/components/forms/new-password-form";

export const metadata = {
    title: "Obnovení hesla | Helmáč",
    description: "Nastavte si nové heslo",
};

export default async function ObnoveniHeslaPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    if (!token) {
        return (
            <>
                <PageHeader
                    title="Obnovení hesla"
                    icon="skeleton-key"
                    subtitle="Neplatný odkaz"
                />
                <Container maxWidth="sm" sx={{ pb: 8 }}>
                    <Card
                        sx={{
                            mt: 4,
                            textAlign: "center",
                        }}
                    >
                        <Typography color="error">
                            Chybí ověřovací token. Zkontrolujte odkaz
                            z emailu.
                        </Typography>
                    </Card>
                </Container>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Obnovení hesla"
                subtitle="Nastavte si nové heslo"
            />
            <Container maxWidth="sm" sx={{ pb: 8 }}>
                <Card
                    sx={{
                        mt: 4,
                    }}
                >
                    <NewPasswordForm token={token} />
                </Card>
            </Container>
        </>
    );
}
