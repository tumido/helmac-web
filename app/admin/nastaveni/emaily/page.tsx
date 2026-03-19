import { Container } from "@mui/material";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { getEmailAccounts } from "@/lib/actions/email-accounts";
import { EmailAccountsList } from "@/components/admin/email-accounts-list";

export default async function EmailyNastaveniPage() {
    await requireAdmin();

    const accounts = await getEmailAccounts();

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Nastavení", href: "/admin/nastaveni" },
                    { label: "Emailové účty" },
                ]}
                title="Emailové účty"
            />

            <EmailAccountsList accounts={accounts} />
        </Container>
    );
}
