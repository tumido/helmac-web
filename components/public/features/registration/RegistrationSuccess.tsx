import Link from "next/link";
import { Box, Typography, Button, Paper } from "@mui/material";
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
                Registrace uspesna!
            </Typography>
            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 500, mx: "auto" }}
            >
                {message}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Potvrzeni jsme vam zaslali na email. Sledujte novinky pro dalsi
                informace o platbe a dalsich pokynech.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button component={Link} href="/" variant="contained">
                    Zpet na hlavni stranku
                </Button>
                <Button component={Link} href="/novinky" variant="outlined">
                    Sledovat novinky
                </Button>
            </Box>
        </Paper>
    );
}
