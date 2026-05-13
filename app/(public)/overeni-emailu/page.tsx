import { Container } from "@mui/material";
import { PageHeader, Card } from "@/components/public/ui";
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
                icon="wax-seal"
            />
            <Container maxWidth="sm" sx={{ pb: 8 }}>
                <Card sx={{ mt: 4 }}>
                    <EmailVerificationContent email={params.email} />
                </Card>
            </Container>
        </>
    );
}
