import { Container, Typography, Box } from "@mui/material";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { UserForm } from "@/components/forms/user-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

export default async function NewUserPage() {
    // Check permissions
    try {
        await requireSuperAdmin();
    } catch {
        redirect("/admin");
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Uzivatele", href: "/admin/uzivatele" },
                    { label: "Novy uzivatel" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4">Novy uzivatel</Typography>
            </Box>

            <UserForm mode="create" />
        </Container>
    );
}
