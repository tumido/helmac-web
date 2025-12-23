"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { publicTheme, publicLightTheme } from "@/styles/theme";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { Header } from "./Header";
import { Footer } from "./Footer";

function ThemedContent({ children }: { children: React.ReactNode }) {
    const { isDark } = useThemeMode();
    const theme = isDark ? publicTheme : publicLightTheme;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                    transition: "background-color 0.3s ease-in-out",
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

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeModeProvider>
            <ThemedContent>{children}</ThemedContent>
        </ThemeModeProvider>
    );
}
