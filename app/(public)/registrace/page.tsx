import { Container, Typography, Box } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { DynamicRegistrationForm } from "@/components/public/features/registration/DynamicRegistrationForm";
import { getRegistrationStatus, getOptionCountsForYear } from "@/lib/services";
import { getFilteredRegistrationStats } from "@/lib/services/registration";
import type { RegistrationStats } from "@/lib/services/registration";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatDate } from "@/lib/utils/date";
import { getPublicSession } from "@/lib/public-auth";
import type { ContentBlock } from "@/lib/types/content-blocks";
import { extractStatBlocks } from "@/lib/types/content-blocks";

export const metadata = {
    title: "Registrace | Helmáč",
    description: "Zaregistrujte se na akci Helmáč",
};

export default async function RegistracePage() {
    const status = await getRegistrationStatus();

    if (!status.isOpen) {
        return (
            <>
                <PageHeader
                    title="Registrace"
                    subtitle="Registrace není momentálně otevřena"
                    icon="tied-scroll"
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
                    icon="tied-scroll"
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

    const successContent =
        (status.year?.registrationSuccessContent as unknown as ContentBlock[] | null) ?? null;
    const statBlocks =
        successContent && Array.isArray(successContent)
            ? extractStatBlocks(successContent)
            : [];

    const [optionCounts, publicSession] = await Promise.all([
        formData.capacityLimits.length > 0
            ? getOptionCountsForYear(status.year!.id)
            : Promise.resolve(undefined),
        getPublicSession(),
    ]);

    let stats: Record<string, RegistrationStats> | undefined;
    if (statBlocks.length > 0) {
        const entries = await Promise.all(
            statBlocks.map(async (b) =>
                [
                    b.id,
                    await getFilteredRegistrationStats(
                        status.year!.id,
                        b.filter
                    ),
                ] as const
            )
        );
        stats = Object.fromEntries(entries);
    }

    return (
        <>
            <PageHeader
                title="Registrace"
                subtitle={`Zaregistrujte se na ${status.year?.title}`}
                icon="tied-scroll"
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <DynamicRegistrationForm
                    formData={formData}
                    optionCounts={optionCounts}
                    isLoggedIn={!!publicSession}
                    publicEmail={publicSession?.email}
                    successContent={successContent}
                    stats={stats}
                />
            </Container>
        </>
    );
}
