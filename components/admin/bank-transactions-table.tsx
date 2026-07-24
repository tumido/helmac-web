"use client";

import {
    Box,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useState } from "react";
import Link from "next/link";
import type { BankTransactionMatchStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils/date";
import { PairTransactionButton } from "@/components/admin/pair-transaction-button";
import type { UnpaidOrderOption } from "@/lib/services/v2";

interface TransactionRow {
    id: string;
    date: string;
    amount: number;
    currency: string;
    variableSymbol: string | null;
    counterpartAccount: string | null;
    counterpartName: string | null;
    matchStatus: BankTransactionMatchStatus;
    orderId: string | null;
    legacySubmissionId: string | null;
}

interface BankTransactionsTableProps {
    transactions: TransactionRow[];
    yearId: string;
    unpaidOrders?: UnpaidOrderOption[];
    showFilter?: boolean;
}

const statusConfig: Record<BankTransactionMatchStatus, { label: string; color: "success" | "warning" | "error" | "info" | "default" }> = {
    UNPROCESSED: { label: "Nezpracováno", color: "default" },
    MATCHED: { label: "Spárováno", color: "success" },
    PARTIAL_PAYMENT: { label: "Částečná platba", color: "warning" },
    OVERPAYMENT: { label: "Přeplatek", color: "success" },
    NO_VARIABLE_SYMBOL: { label: "Bez VS", color: "default" },
    UNKNOWN_VS: { label: "Neznámý VS", color: "error" },
    ALREADY_PAID: { label: "Již zaplaceno", color: "info" },
    OUTGOING: { label: "Odchozí", color: "default" },
};

const PAIRABLE_STATUSES = new Set<BankTransactionMatchStatus>([
    "UNKNOWN_VS",
    "NO_VARIABLE_SYMBOL",
]);

export function BankTransactionsTable({
    transactions,
    yearId,
    unpaidOrders,
    showFilter = false,
}: BankTransactionsTableProps) {
    const [filter, setFilter] = useState<string>("ALL");

    const filtered = filter === "ALL"
        ? transactions
        : transactions.filter((tx) => tx.matchStatus === filter);

    if (transactions.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Zatím žádné transakce.
            </Typography>
        );
    }

    return (
        <Box>
            {showFilter && (
                <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                    <InputLabel>Filtr stavu</InputLabel>
                    <Select
                        value={filter}
                        label="Filtr stavu"
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <MenuItem value="ALL">Vše</MenuItem>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                            <MenuItem key={key} value={key}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Datum</TableCell>
                            <TableCell align="right">Částka</TableCell>
                            <TableCell>VS</TableCell>
                            <TableCell>Odesílatel</TableCell>
                            <TableCell>Stav</TableCell>
                            <TableCell>Registrace</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((tx) => {
                            const config = statusConfig[tx.matchStatus];
                            return (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        {formatDate(tx.date)}
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        color: tx.amount < 0 ? "error.main" : "success.main",
                                        fontWeight: 500,
                                    }}>
                                        {tx.amount.toLocaleString("cs-CZ")} {tx.currency}
                                    </TableCell>
                                    <TableCell>
                                        {tx.variableSymbol || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {tx.counterpartName || tx.counterpartAccount || "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={config.label}
                                            color={config.color}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {tx.orderId ? (
                                            <Link
                                                href={`/admin/rocniky/${yearId}/registrace/${tx.legacySubmissionId ?? tx.orderId}`}
                                                style={{ color: "inherit" }}
                                            >
                                                Detail
                                            </Link>
                                        ) : unpaidOrders && PAIRABLE_STATUSES.has(tx.matchStatus) ? (
                                            <PairTransactionButton
                                                transactionId={tx.id}
                                                unpaidOrders={unpaidOrders}
                                            />
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
