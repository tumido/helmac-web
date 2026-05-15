import { Box, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { formatPrice } from "@/lib/utils/pricing";

export function InlinePayment({
    spaydString,
    amount,
    bankAccount,
    variableSymbol,
}: {
    spaydString: string;
    amount: number;
    bankAccount: string;
    variableSymbol: string;
}) {
    return (
        <Box
            sx={{
                mt: { xs: 2, md: 0 },
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "center", sm: "flex-start" },
                gap: { xs: 2, sm: 3 },
            }}
        >
            <Box
                sx={{
                    p: 1.5,
                    backgroundColor: "#fff",
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <QRCodeSVG value={spaydString} size={120} level="M" />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    textAlign: { xs: "center", sm: "left" },
                }}
            >
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ color: "primary.main" }}
                >
                    Platba převodem
                </Typography>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Částka
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {formatPrice(amount)}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Číslo účtu
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                    >
                        {bankAccount}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Variabilní symbol
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: "monospace",
                            letterSpacing: 2,
                        }}
                    >
                        {variableSymbol}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
