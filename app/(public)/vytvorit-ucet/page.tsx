import { Container, Box, Typography } from "@mui/material";
import Link from "next/link";
import { PageHeader, Card } from "@/components/public/ui";
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
                icon="quill"
            />
            <Container maxWidth="sm" sx={{ pb: 8 }}>
                <Card
                    sx={{
                        mt: 4,
                    }}
                >
                    <PublicRegisterForm />

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Již máte účet?{" "}
                            <Link
                                href="/prihlaseni"
                                style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                }}
                            >
                                Přihlaste se
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </Container>
        </>
    );
}
