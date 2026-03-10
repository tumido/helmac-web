import { Container } from "@mui/material";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/admin/page-header";

export default async function NewUserPage() {
    // Check permissions
    try {
        await requireSuperAdmin();
    } catch {
        redirect("/admin");
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Uzivatele", href: "/admin/uzivatele" },
                    { label: "Novy uzivatel" },
                ]}
                title="Novy uzivatel"
            />

            <UserForm mode="create" />
        </Container>
    );
}
