import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { BankAccountSettings } from "@/components/admin/bank-account-settings";

interface BankaPageProps {
    params: Promise<{ id: string }>;
}

async function getYearBankAccount(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            bankAccountPrefix: true,
            bankAccountNumber: true,
            bankAccountBankCode: true,
        },
    });
}

export default async function BankaPage({ params }: BankaPageProps) {
    await requireAdmin();
    const { id } = await params;
    const year = await getYearBankAccount(id);

    if (!year) {
        notFound();
    }

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
        </Container>
    );
}
