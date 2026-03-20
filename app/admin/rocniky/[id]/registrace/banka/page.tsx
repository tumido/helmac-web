import { Box, Container, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { BankAccountSettings } from "@/components/admin/bank-account-settings";
import { FioTokenSettings } from "@/components/admin/fio-token-settings";
import { BankTransactionsTable } from "@/components/admin/bank-transactions-table";

interface BankaPageProps {
    params: Promise<{ id: string }>;
}

async function getYearBankData(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            bankAccountPrefix: true,
            bankAccountNumber: true,
            bankAccountBankCode: true,
            encryptedFioToken: true,
            fioSyncEnabled: true,
            lastFioSyncAt: true,
        },
    });
}

async function getRecentTransactions(yearId: string) {
    return db.bankTransaction.findMany({
        where: { yearId },
        orderBy: { date: "desc" },
        take: 20,
        select: {
            id: true,
            date: true,
            amount: true,
            currency: true,
            variableSymbol: true,
            counterpartAccount: true,
            counterpartName: true,
            matchStatus: true,
            submissionId: true,
        },
    });
}

export default async function BankaPage({ params }: BankaPageProps) {
    await requireAdmin();
    const { id } = await params;
    const [year, transactions] = await Promise.all([
        getYearBankData(id),
        getRecentTransactions(id),
    ]);

    if (!year) {
        notFound();
    }

    const transactionsForClient = transactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
    }));

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                    { label: "Banka" },
                ]}
                title="Banka"
            />

            <BankAccountSettings
                yearId={year.id}
                bankAccountPrefix={year.bankAccountPrefix}
                bankAccountNumber={year.bankAccountNumber}
                bankAccountBankCode={year.bankAccountBankCode}
            />

            <FioTokenSettings
                yearId={year.id}
                hasToken={!!year.encryptedFioToken}
                syncEnabled={year.fioSyncEnabled}
                lastSyncAt={year.lastFioSyncAt?.toISOString() ?? null}
            />

            {transactionsForClient.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Poslední transakce
                    </Typography>
                    <BankTransactionsTable
                        transactions={transactionsForClient}
                        yearId={year.id}
                    />
                </Box>
            )}
        </Container>
    );
}
