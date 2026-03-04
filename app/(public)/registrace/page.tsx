import { Container, Typography, Box } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { RegistrationForm } from "@/components/public/features/registration";
import { getRegistrationStatus, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Registrace | Helmac",
    description: "Zaregistrujte se na akci Helmac",
};

export default async function RegistracePage() {
    const [status, activeYear] = await Promise.all([
        getRegistrationStatus(),
        getActiveYear(),
    ]);

    if (!status.isOpen) {
        return (
            <>
                <PageHeader
                    title="Registrace"
                    subtitle="Registrace není momentálně otevřena"
                    backgroundImage={activeYear?.headerPhoto || undefined}
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
                        {status.registrationStartDate ? (
                            <>
                                <Typography variant="h5" gutterBottom>
                                    Registrace se otevře {new Date(status.registrationStartDate).toLocaleDateString("cs-CZ")}
                                </Typography>
                                <Typography color="text.secondary">
                                    Sledujte novinky, ať nepromeškáte začátek registrací.
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h5">
                                Registrace není momentálně otevřena
                            </Typography>
                        )}
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
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <RegistrationForm />
            </Container>
        </>
    );
}
