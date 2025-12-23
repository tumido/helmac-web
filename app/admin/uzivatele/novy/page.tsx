import { Container, Typography, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Link from "next/link";
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
                <Button
                    component={Link}
                    href="/admin/uzivatele"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na uzivatele
                </Button>
                <Typography variant="h4">Novy uzivatel</Typography>
            </Box>

            <UserForm mode="create" />
        </Container>
    );
}
