import { Container, Box, Typography, Paper } from "@mui/material";
import Link from "next/link";
import { PageHeader } from "@/components/public/ui";
import { PublicLoginForm } from "@/components/forms/public-login-form";

export const metadata = {
    title: "Přihlášení | Helmac",
    description: "Přihlaste se ke svému účtu",
};

export default function PrihlaseniPage() {
    return (
        <>
            <PageHeader
                title="Přihlášení"
                subtitle="Přihlaste se ke svému účtu"
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
                    <PublicLoginForm />

                    <Box sx={{ textAlign: "center", mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nemáte účet?{" "}
                            <Link
                                href="/vytvorit-ucet"
                                style={{ color: "inherit", textDecoration: "none" }}
                            >
                                Vytvořte si ho
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}
