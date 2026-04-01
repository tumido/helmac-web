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

interface TransactionRow {
    id: string;
    date: string;
    amount: number;
    currency: string;
    variableSymbol: string | null;
    counterpartAccount: string | null;
    counterpartName: string | null;
    matchStatus: BankTransactionMatchStatus;
    submissionId: string | null;
}

interface BankTransactionsTableProps {
    transactions: TransactionRow[];
    yearId: string;
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

export function BankTransactionsTable({
    transactions,
    yearId,
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
                                        {tx.submissionId ? (
                                            <Link
                                                href={`/admin/rocniky/${yearId}/registrace/prihlasky/${tx.submissionId}`}
                                                style={{ color: "inherit" }}
                                            >
                                                Detail
                                            </Link>
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
