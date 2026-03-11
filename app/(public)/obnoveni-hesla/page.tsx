import { Container, Typography, Paper } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { NewPasswordForm } from "@/components/forms/new-password-form";

export const metadata = {
    title: "Obnovení hesla | Helmac",
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
                    subtitle="Neplatný odkaz"
                />
                <Container maxWidth="sm" sx={{ pb: 8 }}>
                    <Paper
                        elevation={2}
                        sx={{
                            mt: -4,
                            p: 4,
                            position: "relative",
                            zIndex: 1,
                            backgroundColor: "background.paper",
                            textAlign: "center",
                        }}
                    >
                        <Typography color="error">
                            Chybí ověřovací token. Zkontrolujte odkaz z emailu.
                        </Typography>
                    </Paper>
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
                <Paper
                    elevation={2}
                    sx={{
                        mt: -4,
                        p: 4,
                        position: "relative",
                        zIndex: 1,
                        backgroundColor: "background.paper",
                    }}
                >
                    <NewPasswordForm token={token} />
                </Paper>
            </Container>
        </>
    );
}
