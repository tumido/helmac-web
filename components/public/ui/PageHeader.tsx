import { Box, Container, Typography } from "@mui/material";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
    return (
        <Box
            sx={{
                position: "relative",
                color: "common.white",
                py: { xs: 6, md: 8 },
                backgroundImage: "url(/images/battle-bg.png)",
                backgroundSize: "100% auto",
                backgroundPosition: "center 55%",
                backgroundRepeat: "no-repeat",
                mb: "25px",
            }}
        >
            {/* Dark overlay */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(26, 26, 26, 0.75)",
                    zIndex: 0,
                }}
            />
            {/* Bottom gradient fade */}
            <Box
                sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "50%",
                    background:
                        "linear-gradient(to bottom, transparent 0%, #1A1A1A 100%)",
                    zIndex: 0,
                }}
            />
            <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        color: "common.white",
                        fontSize: { xs: "2rem", md: "3rem" },
                        textAlign: "center",
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body1"
                        sx={{
                            textAlign: "center",
                            mt: 2,
                            opacity: 0.9,
                            maxWidth: 600,
                            mx: "auto",
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Container>
        </Box>
    );
}
