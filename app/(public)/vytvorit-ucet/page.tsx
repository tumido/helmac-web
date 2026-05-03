import { Container, Box, Typography, Paper } from "@mui/material";
import Link from "next/link";
import { PageHeader } from "@/components/public/ui";
import { PublicRegisterForm } from "@/components/forms/public-register-form";

export const metadata = {
    title: "Vytvoření účtu | Helmáč",
    description: "Vytvořte si účet pro sledování registrací a plateb",
};

export default function VytvoritUcetPage() {
    return (
        <>
            <PageHeader
                title="Vytvoření účtu"
                subtitle="Zaregistrujte se pro sledování svých registrací"
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
                    <PublicRegisterForm />

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Již máte účet?{" "}
                            <Link
                                href="/prihlaseni"
                                style={{ color: "inherit", textDecoration: "none" }}
                            >
                                Přihlaste se
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}
