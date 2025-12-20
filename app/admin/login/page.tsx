import { Container, Box, Typography, Paper } from "@mui/material";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Typography component="h1" variant="h5">
                        Helmac Admin
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Prihlaste se do administrace
                    </Typography>
                    <LoginForm />
                </Paper>
            </Box>
        </Container>
    );
}
