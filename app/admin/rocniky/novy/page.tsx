import { Container, Typography, Box } from "@mui/material";
import { YearForm } from "@/components/forms/year-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

export default function NewYearPage() {
    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: "Novy rocnik" },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4">Novy rocnik</Typography>
            </Box>

            <YearForm mode="create" />
        </Container>
    );
}
