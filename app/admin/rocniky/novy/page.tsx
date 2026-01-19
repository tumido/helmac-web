import { Container, Typography, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { YearForm } from "@/components/forms/year-form";

export default function NewYearPage() {
    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4 }}>
                <LinkButton
                    href="/admin/rocniky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocniky
                </LinkButton>
                <Typography variant="h4">Novy rocnik</Typography>
            </Box>

            <YearForm mode="create" />
        </Container>
    );
}
