import { Container, Paper } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { EmailVerificationContent } from "./email-verification-content";

export const metadata = {
    title: "Ověření emailu | Helmáč",
    description: "Ověřte svůj email pro aktivaci účtu",
};

export default async function OvereniEmailuPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string; pending?: string; email?: string }>;
}) {
    const params = await searchParams;

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
                    <EmailVerificationContent email={params.email} />
                </Paper>
            </Container>
        </>
    );
}
