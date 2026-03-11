import {
    Paper,
    Typography,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { requirePublicAuth } from "@/lib/public-auth";
import { getPublicUserPayments } from "@/lib/services/public-user";
import { formatCzechAccount } from "@/lib/utils/spayd";

export const metadata = {
    title: "Platby | Helmac",
};

export default async function PaymentsPage() {
    const session = await requirePublicAuth();
    const payments = await getPublicUserPayments(session.sub);

    if (payments.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                    Zatím nemáte žádné platby.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6">
                    Přehled plateb
                </Typography>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ročník</TableCell>
                            <TableCell align="right">Částka</TableCell>
                            <TableCell>VS</TableCell>
                            <TableCell>Účet</TableCell>
                            <TableCell>Stav</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.map((payment) => {
                            const bankAccount = payment.year.bankAccountNumber && payment.year.bankAccountBankCode
                                ? formatCzechAccount(
                                    payment.year.bankAccountNumber,
                                    payment.year.bankAccountBankCode,
                                    payment.year.bankAccountPrefix ?? undefined,
                                )
                                : "–";

                            return (
                                <TableRow key={payment.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {payment.year.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {payment.totalPrice} Kč
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                            {payment.variableSymbol || "–"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                            {bankAccount}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {payment.isPaid ? (
                                            <Chip label="Zaplaceno" color="success" size="small" />
                                        ) : (
                                            <Chip label="Čeká na platbu" color="warning" size="small" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
