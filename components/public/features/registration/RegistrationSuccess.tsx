import { Box, Typography, Paper } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { CheckCircle } from "@mui/icons-material";
import { formatPrice } from "@/lib/utils/pricing";

interface RegistrationSuccessProps {
    message: string;
    variableSymbol?: string;
    totalPrice?: number;
}

export function RegistrationSuccess({ message, variableSymbol, totalPrice }: RegistrationSuccessProps) {
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
                sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
            >
                {message}
            </Typography>

            {(totalPrice != null || variableSymbol) && (
                <Paper
                    variant="outlined"
                    sx={{ p: 3, mb: 3, maxWidth: 400, mx: "auto", textAlign: "left" }}
                >
                    {totalPrice != null && (
                        <Box sx={{ mb: variableSymbol ? 2 : 0 }}>
                            <Typography variant="body2" color="text.secondary">
                                Celková cena:
                            </Typography>
                            <Typography variant="h5" fontWeight={600}>
                                {formatPrice(totalPrice)}
                            </Typography>
                        </Box>
                    )}
                    {variableSymbol && (
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Variabilní symbol pro platbu:
                            </Typography>
                            <Typography
                                variant="h5"
                                fontWeight={600}
                                sx={{ fontFamily: "monospace", letterSpacing: 2 }}
                            >
                                {variableSymbol}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}

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
