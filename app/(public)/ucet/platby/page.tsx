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
import { formatCzechAccount, czechAccountToIBAN, generateSPAYD } from "@/lib/utils/spayd";
import { PaymentQrDialog } from "@/components/public/features/account/payment-qr-dialog";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { runPaymentSync } from "@/lib/utils/sync-payments";

export const metadata = {
    title: "Platby | Helmac",
};

export default async function PaymentsPage() {
    const session = await requirePublicAuth();

    // Trigger bank sync before loading payment data (rate-limited)
    await runPaymentSync();

    const [payments, globalBank] = await Promise.all([
        getPublicUserPayments(session.sub),
        getGlobalBankAccount(),
    ]);

    const hasBankInfo = !!(globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode);
    const bankAccountFormatted = hasBankInfo
        ? formatCzechAccount(
            globalBank!.bankAccountNumber!,
            globalBank!.bankAccountBankCode!,
            globalBank!.bankAccountPrefix ?? undefined,
        )
        : "–";

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
                            <TableCell padding="checkbox" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.map((payment) => {
                            let spaydString: string | null = null;
                            if (!payment.isPaid && hasBankInfo && payment.variableSymbol && payment.totalPrice != null) {
                                const iban = czechAccountToIBAN(
                                    globalBank!.bankAccountNumber!,
                                    globalBank!.bankAccountBankCode!,
                                    globalBank!.bankAccountPrefix ?? undefined,
                                );
                                if (iban) {
                                    spaydString = generateSPAYD({
                                        iban,
                                        amount: payment.totalPrice,
                                        variableSymbol: payment.variableSymbol,
                                    });
                                }
                            }

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
                                            {bankAccountFormatted}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {payment.isPaid ? (
                                            <Chip label="Zaplaceno" color="success" size="small" />
                                        ) : (
                                            <Chip label="Čeká na platbu" color="warning" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell padding="checkbox">
                                        {spaydString && (
                                            <PaymentQrDialog
                                                spaydString={spaydString}
                                                amount={payment.totalPrice!}
                                                bankAccount={bankAccountFormatted}
                                                variableSymbol={payment.variableSymbol!}
                                            />
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
