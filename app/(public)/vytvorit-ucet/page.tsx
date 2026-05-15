import { Container, Box, Typography } from "@mui/material";
import Link from "next/link";
import {
    PageHeader,
    Card,
    ParchmentCallout,
} from "@/components/public/ui";
import { PublicRegisterForm } from "@/components/forms/public-register-form";

export const metadata = {
    title: "Vytvoření účtu | Helmáč",
    description: "Vytvořte si účet pro sledování registrací a plateb",
};

interface VytvoritUcetPageProps {
    searchParams: Promise<{ deleted?: string }>;
}

export default async function VytvoritUcetPage({
    searchParams,
}: VytvoritUcetPageProps) {
    const { deleted } = await searchParams;

    return (
        <>
            <PageHeader
                title="Vytvoření účtu"
                subtitle="Zaregistrujte se pro sledování svých registrací"
                icon="quill"
            />
            <Container maxWidth="sm" sx={{ pb: 8 }}>
                {deleted && (
                    <ParchmentCallout sx={{ mt: 4 }}>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Váš účet byl odstraněn.
                            Omlouváme se za nepříjemnosti.
                            Pokud chcete pokračovat,
                            vytvořte si prosím nový účet.
                        </Typography>
                    </ParchmentCallout>
                )}
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
