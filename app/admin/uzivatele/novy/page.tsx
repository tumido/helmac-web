import { Container, Typography, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { UserForm } from "@/components/forms/user-form";

export default async function NewUserPage() {
    // Check permissions
    try {
        await requireSuperAdmin();
    } catch {
        redirect("/admin");
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4 }}>
                <LinkButton
                    href="/admin/uzivatele"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na uzivatele
                </LinkButton>
                <Typography variant="h4">Novy uzivatel</Typography>
            </Box>

            <UserForm mode="create" />
        </Container>
    );
}
