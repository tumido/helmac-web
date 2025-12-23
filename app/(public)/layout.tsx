import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { publicTheme } from "@/styles/theme";
import { Header } from "@/components/public/layout/Header";
import { Footer } from "@/components/public/layout/Footer";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider theme={publicTheme}>
            <CssBaseline />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                }}
            >
                <Header />
                <Box component="main" sx={{ flex: 1 }}>
                    {children}
                </Box>
                <Footer />
            </Box>
        </ThemeProvider>
    );
}
