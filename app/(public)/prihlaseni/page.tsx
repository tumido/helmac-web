import { Container, Box, Typography } from "@mui/material";
import Link from "next/link";
import { PageHeader, Card } from "@/components/public/ui";
import { PublicLoginForm } from "@/components/forms/public-login-form";

export const metadata = {
    title: "Přihlášení | Helmáč",
    description: "Přihlaste se ke svému účtu",
};

export default function PrihlaseniPage() {
    return (
        <>
            <PageHeader
                title="Přihlášení"
                subtitle="Přihlaste se ke svému účtu"
                icon="quill"
            />
            <Container maxWidth="sm" sx={{ pb: 8 }}>
                <Card
                    sx={{
                        mt: 4,
                    }}
                >
                    <PublicLoginForm />

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Nemáte účet?{" "}
                            <Link
                                href="/vytvorit-ucet"
                                style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                }}
                            >
                                Vytvořte si ho
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </Container>
        </>
    );
}
