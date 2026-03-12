import { Container, Paper } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { EmailVerificationContent } from "./email-verification-content";
import { getPublicSession, clearPublicSession } from "@/lib/public-auth";

export const metadata = {
    title: "Ověření emailu | Helmac",
    description: "Ověřte svůj email pro aktivaci účtu",
};

export default async function OvereniEmailuPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; pending?: string }>;
}) {
    const params = await searchParams;

    // On reload (no token, no pending), clear any unverified session
    // so the user can navigate to /prihlaseni and authenticate again
    if (!params.token && !params.pending) {
        const session = await getPublicSession();
        if (session && !session.emailVerified) {
            await clearPublicSession();
        }
    }

    return (
        <>
            <PageHeader
                title="Ověření emailu"
                subtitle="Aktivace vašeho účtu"
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
                    <EmailVerificationContent />
                </Paper>
            </Container>
        </>
    );
}
