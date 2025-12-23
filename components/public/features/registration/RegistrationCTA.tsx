import Link from "next/link";
import { Box, Container, Typography, Button } from "@mui/material";
import { getRegistrationStatus } from "@/lib/services";

export async function RegistrationCTA() {
    const status = await getRegistrationStatus();

    if (!status.isOpen) {
        return (
            <Container maxWidth="md">
                <Box
                    sx={{
                        textAlign: "center",
                        py: { xs: 6, md: 10 },
                        color: "common.white",
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            color: "common.white",
                            mb: 2,
                        }}
                    >
                        Registrace bude brzy otevrena
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ opacity: 0.9, maxWidth: 600, mx: "auto" }}
                    >
                        Sledujte novinky, at nepropsnete zacatek registraci na
                        dalsi rocnik.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    textAlign: "center",
                    py: { xs: 6, md: 10 },
                    color: "common.white",
                }}
            >
                <Typography
                    variant="h3"
                    component="h2"
                    sx={{
                        fontFamily: '"Cinzel", serif',
                        color: "common.white",
                        mb: 2,
                    }}
                >
                    Pripojte se k dobrodruzstvi
                </Typography>
                <Typography
                    variant="body1"
                    sx={{ opacity: 0.9, mb: 4, maxWidth: 600, mx: "auto" }}
                >
                    Registrace na {status.year?.title} je otevrena. Pojdte
                    zazit nezapomenutelny LARP zazittek.
                </Typography>
                <Link
                    href="/registrace"
                    style={{ textDecoration: "none" }}
                >
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        sx={{
                            px: 5,
                            py: 1.5,
                            fontSize: "1.1rem",
                        }}
                    >
                        Zaregistrovat se
                    </Button>
                </Link>
                {status.registrationCount > 0 && (
                    <Typography
                        variant="body2"
                        sx={{ mt: 2, opacity: 0.7 }}
                    >
                        Jiz {status.registrationCount} registrovanych ucastniku
                    </Typography>
                )}
            </Box>
        </Container>
    );
}
