import { Container } from "@mui/material";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { BankAccountSettings } from "@/components/admin/bank-account-settings";
import { FioTokenSettings } from "@/components/admin/fio-token-settings";
import { getGlobalBankAccount } from "@/lib/services/bank-account";

export default async function BankaPage() {
    await requireAdmin();
    const bankAccount = await getGlobalBankAccount();

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Nastavení", href: "/admin/nastaveni" },
                    { label: "Banka" },
                ]}
                title="Banka"
            />

            <BankAccountSettings
                bankAccountPrefix={bankAccount?.bankAccountPrefix ?? null}
                bankAccountNumber={bankAccount?.bankAccountNumber ?? null}
                bankAccountBankCode={bankAccount?.bankAccountBankCode ?? null}
            />

            <FioTokenSettings
                hasToken={!!bankAccount?.encryptedFioToken}
                syncEnabled={bankAccount?.fioSyncEnabled ?? false}
                lastSyncAt={bankAccount?.lastFioSyncAt?.toISOString() ?? null}
            />
        </Container>
    );
}
