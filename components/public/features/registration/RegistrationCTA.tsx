import Link from "next/link";
import { Box, Container, Typography, Button } from "@mui/material";
import { getRegistrationStatus } from "@/lib/services";
import { formatDate } from "@/lib/utils/date";

export async function RegistrationCTA() {
    const status = await getRegistrationStatus();

    if (!status.isOpen || !status.hasForm) {
        if (!status.registrationStartDate) {
            return null;
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
                            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                        }}
                    >
                        Registrace se otevře {formatDate(status.registrationStartDate)}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ opacity: 0.9, maxWidth: 600, mx: "auto" }}
                    >
                        Sledujte novinky, ať nepromeškáte začátek registrací.
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
                        fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                    }}
                >
                    Připojte se k dobrodružství
                </Typography>
                <Typography
                    variant="body1"
                    sx={{ opacity: 0.9, mb: 4, maxWidth: 600, mx: "auto" }}
                >
                    Registrace na {status.year?.title} je otevřena. Pojďte
                    zažít nezapomenutelný LARP zážitek.
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
                        variant="body1"
                        sx={{ mt: 2, opacity: 0.7 }}
                    >
                        Již {status.registrationCount} registrovaných účastníků
                    </Typography>
                )}
            </Box>
        </Container>
    );
}
