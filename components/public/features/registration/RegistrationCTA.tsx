import Link from "next/link";
import { Box, Container, Typography, Button } from "@mui/material";
import { getRegistrationStatus } from "@/lib/services";
import { formatDate } from "@/lib/utils/date";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { paperGrainSx } from "@/lib/utils/texture-overlay";

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
                        color: "primary.contrastText",
                        position: "relative",
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            color: "primary.contrastText",
                            mb: 1,
                            fontSize: {
                                xs: "1.8rem",
                                sm: "2.5rem",
                                md: "3rem",
                            },
                            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                    >
                        Registrace se otevře{" "}
                        {formatDate(status.registrationStartDate)}
                    </Typography>
                    <OrnamentalUnderline
                        sx={{ color: "primary.contrastText" }}
                    />
                    <Typography
                        variant="body1"
                        sx={{
                            opacity: 0.9,
                            maxWidth: 600,
                            mx: "auto",
                            mt: 2,
                            letterSpacing: "0.02em",
                            color: "primary.contrastText",
                        }}
                    >
                        Sledujte novinky, ať nepromeškáte začátek registrací.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Box
            sx={{
                position: "relative",
                ...paperGrainSx,
            }}
        >
            <Container maxWidth="md">
                <Box
                    sx={{
                        textAlign: "center",
                        py: { xs: 6, md: 10 },
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h2"
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            color: "primary.contrastText",
                            mb: 1,
                            fontSize: {
                                xs: "1.8rem",
                                sm: "2.5rem",
                                md: "3rem",
                            },
                            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                    >
                        Připojte se k dobrodružství
                    </Typography>
                    <OrnamentalUnderline
                        sx={{ color: "primary.contrastText" }}
                    />
                    <Typography
                        variant="body1"
                        sx={{
                            opacity: 0.9,
                            mb: 4,
                            mt: 2,
                            maxWidth: 600,
                            mx: "auto",
                            color: "primary.contrastText",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Registrace na {status.year?.title} je otevřena. Pojďte
                        zažít nezapomenutelný LARP zážitek.
                    </Typography>
                    <Link href="/registrace" style={{ textDecoration: "none" }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            sx={{
                                px: 6,
                                py: 2,
                                fontSize: "1.2rem",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                                transition:
                                    "transform 0.2s ease, box-shadow 0.2s ease",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 6px 25px rgba(0,0,0,0.4)",
                                },
                            }}
                        >
                            Zaregistrovat se
                        </Button>
                    </Link>
                </Box>
            </Container>
        </Box>
    );
}
