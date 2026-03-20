import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { BankTransactionsTable } from "@/components/admin/bank-transactions-table";

interface TransakcePageProps {
    params: Promise<{ id: string }>;
}

async function getYearBasic(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: { id: true, year: true },
    });
}

async function getAllTransactions(yearId: string) {
    return db.bankTransaction.findMany({
        where: { yearId },
        orderBy: { date: "desc" },
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

export default async function TransakcePage({ params }: TransakcePageProps) {
    await requireAdmin();
    const { id } = await params;
    const [year, transactions] = await Promise.all([
        getYearBasic(id),
        getAllTransactions(id),
    ]);

    if (!year) {
        notFound();
    }

    const transactionsForClient = transactions.map((tx) => ({
        ...tx,
        date: tx.date.toISOString(),
    }));

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                    { label: "Transakce" },
                ]}
                title="Bankovní transakce"
            />

            <BankTransactionsTable
                transactions={transactionsForClient}
                yearId={year.id}
                showFilter
            />
        </Container>
    );
}
