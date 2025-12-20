import { Container, Typography, Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import Link from "next/link";
import { YearForm } from "@/components/forms/year-form";

export default function NewYearPage() {
    return (
        <Container maxWidth="md">
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href="/admin/rocniky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocniky
                </Button>
                <Typography variant="h4">Novy rocnik</Typography>
            </Box>

            <YearForm mode="create" />
        </Container>
    );
}
