import Link from "next/link";
import { Box, Container, Typography, Divider, Stack } from "@mui/material";

const footerLinks = [
    { label: "Program", href: "/program" },
    { label: "Pravidla", href: "/pravidla" },
    { label: "Galerie", href: "/galerie" },
    { label: "Novinky", href: "/novinky" },
    { label: "Archiv", href: "/archiv" },
    { label: "Registrace", href: "/registrace" },
];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: "background.paper",
                color: "text.primary",
                py: 6,
                mt: "auto",
                borderTop: 1,
                borderColor: "divider",
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "center", md: "flex-start" },
                        gap: 4,
                        mb: 4,
                    }}
                >
                    <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontFamily: '"Cinzel", serif',
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                mb: 1,
                            }}
                        >
                            HELMAC
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ opacity: 0.8, maxWidth: 300 }}
                        >
                            Stredoveka fantasy LARP udalost pro vsechny
                            dobrodruzne duse.
                        </Typography>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={3}
                        flexWrap="wrap"
                        justifyContent="center"
                        sx={{ gap: 2 }}
                    >
                        {footerLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        opacity: 0.8,
                                        transition: "opacity 0.2s",
                                        "&:hover": {
                                            opacity: 1,
                                        },
                                    }}
                                >
                                    {link.label}
                                </Typography>
                            </Link>
                        ))}
                    </Stack>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" sx={{ opacity: 0.6 }}>
                        &copy; {currentYear} Helmac. Vsechna prava vyhrazena.
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.6 }}>
                        Vytvoreno s laskou pro LARP komunitu
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
