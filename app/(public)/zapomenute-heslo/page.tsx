import { Container, Box, Paper } from "@mui/material";
import Link from "next/link";
import { PageHeader } from "@/components/public/ui";
import { PasswordResetForm } from "@/components/forms/password-reset-form";

export const metadata = {
    title: "Zapomenuté heslo | Helmac",
    description: "Obnovte si přístup ke svému účtu",
};

export default function ZapomenuteHesloPage() {
    return (
        <>
            <PageHeader
                title="Zapomenuté heslo"
                subtitle="Zadejte svůj email pro obnovení hesla"
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
                    <PasswordResetForm />

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Link
                            href="/prihlaseni"
                            style={{ fontSize: "0.875rem", color: "inherit", textDecoration: "none" }}
                        >
                            Zpět na přihlášení
                        </Link>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}
