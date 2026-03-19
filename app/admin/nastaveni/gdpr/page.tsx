import { Container } from "@mui/material";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GdprEditor } from "./gdpr-editor";

export default async function GdprPage() {
    await requireAdmin();

    const setting = await db.siteSetting.findUnique({
        where: { key: "gdpr" },
    });

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Nastavení", href: "/admin/nastaveni" },
                    { label: "GDPR" },
                ]}
                title="GDPR"
            />

            <GdprEditor initialContent={setting?.value ?? ""} />
        </Container>
    );
}
