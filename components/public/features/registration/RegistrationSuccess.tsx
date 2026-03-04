import { Box, Typography, Paper } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { CheckCircle } from "@mui/icons-material";

interface RegistrationSuccessProps {
    message: string;
}

export function RegistrationSuccess({ message }: RegistrationSuccessProps) {
    return (
        <Paper
            sx={{
                p: 6,
                textAlign: "center",
                backgroundColor: "background.paper",
            }}
        >
            <CheckCircle
                sx={{
                    fontSize: 80,
                    color: "success.main",
                    mb: 3,
                }}
            />
            <Typography variant="h4" gutterBottom>
                Registrace úspěšná!
            </Typography>
            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 500, mx: "auto" }}
            >
                {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Potvrzení jsme vám zaslali na email. Sledujte novinky pro další
                informace o platbě a dalších pokynech.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <LinkButton href="/" variant="contained">
                    Zpět na hlavní stránku
                </LinkButton>
                <LinkButton href="/novinky" variant="outlined">
                    Sledovat novinky
                </LinkButton>
            </Box>
        </Paper>
    );
}
