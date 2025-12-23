import { Container, Typography, Box } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { RegistrationForm } from "@/components/public/features/registration";
import { getRegistrationStatus } from "@/lib/services";

export const metadata = {
    title: "Registrace | Helmac",
    description: "Zaregistrujte se na akci Helmac",
};

export default async function RegistracePage() {
    const status = await getRegistrationStatus();

    if (!status.isOpen) {
        return (
            <>
                <PageHeader
                    title="Registrace"
                    subtitle="Registrace neni momentalne otevrena"
                />
                <Container maxWidth="md" sx={{ pb: 8 }}>
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 8,
                            backgroundColor: "background.paper",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h5" gutterBottom>
                            Registrace bude brzy otevrena
                        </Typography>
                        <Typography color="text.secondary">
                            Sledujte novinky, at nepropsnete zacatek registraci
                            na dalsi rocnik.
                        </Typography>
                    </Box>
                </Container>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Registrace"
                subtitle={`Zaregistrujte se na ${status.year?.title}`}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <RegistrationForm />
            </Container>
        </>
    );
}
