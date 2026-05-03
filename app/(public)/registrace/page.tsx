import { Container, Typography, Box } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { DynamicRegistrationForm } from "@/components/public/features/registration/DynamicRegistrationForm";
import { getRegistrationStatus, getActiveYear, getOptionCountsForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatDate } from "@/lib/utils/date";
import { getPublicSession } from "@/lib/public-auth";

export const metadata = {
    title: "Registrace | Helmáč",
    description: "Zaregistrujte se na akci Helmáč",
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
                                    Registrace se otevře {formatDate(status.registrationStartDate)}
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

    if (!status.hasForm) {
        return (
            <>
                <PageHeader
                    title="Registrace"
                    subtitle={`Registrace na ${status.year?.title}`}
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
                        <Typography variant="h5">
                            Registrační formulář zatím není připraven
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Zkuste to prosím později.
                        </Typography>
                    </Box>
                </Container>
            </>
        );
    }

    const formData = migrateFormData(status.formFields);

    // Fetch counts if there are capacity limits and session for GDPR
    const [optionCounts, publicSession] = await Promise.all([
        formData.capacityLimits.length > 0
            ? getOptionCountsForYear(status.year!.id)
            : Promise.resolve(undefined),
        getPublicSession(),
    ]);

    return (
        <>
            <PageHeader
                title="Registrace"
                subtitle={`Zaregistrujte se na ${status.year?.title}`}
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <DynamicRegistrationForm formData={formData} optionCounts={optionCounts} isLoggedIn={!!publicSession} publicEmail={publicSession?.email} />
            </Container>
        </>
    );
}
