import { Container, Box, Typography } from "@mui/material";
import Link from "next/link";
import { PageHeader, Card } from "@/components/public/ui";
import { GameIcon } from "@/lib/icons";
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
                    <Box
                        sx={{
                            mt: 4,
                            backgroundColor:
                                "rgba(201, 162, 39, 0.04)",
                            border: "1px solid",
                            borderColor:
                                "rgba(201, 162, 39, 0.15)",
                            borderRadius: 2,
                            p: { xs: 2.5, md: 3 },
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                        }}
                    >
                        <GameIcon
                            name="scroll-unfurled"
                            sx={{
                                color: "primary.main",
                                fontSize: "1.6rem",
                                mt: 0.25,
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            variant="body1"
                            color="text.secondary"
                        >
                            Váš účet byl odstraněn.
                            Omlouváme se za nepříjemnosti.
                            Pokud chcete pokračovat,
                            vytvořte si prosím nový účet.
                        </Typography>
                    </Box>
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
