import { Container, Box, Typography } from "@mui/material";
import Link from "next/link";
import { PageHeader, Card } from "@/components/public/ui";
import { PasswordResetForm } from "@/components/forms/password-reset-form";

export const metadata = {
    title: "Zapomenuté heslo | Helmáč",
    description: "Obnovte si přístup ke svému účtu",
};

export default function ZapomenuteHesloPage() {
    return (
        <>
            <PageHeader
                title="Zapomenuté heslo"
                subtitle="Zadejte svůj email pro obnovení hesla"
                icon="skeleton-key"
            />
            <Container maxWidth="sm" sx={{ pb: 8 }}>
                <Card
                    sx={{
                        mt: 4,
                    }}
                >
                    <PasswordResetForm />

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            <Link
                                href="/prihlaseni"
                                style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                }}
                            >
                                Zpět na přihlášení
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </Container>
        </>
    );
}
