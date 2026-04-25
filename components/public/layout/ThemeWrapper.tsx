"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { publicTheme, publicLightTheme } from "@/styles/theme";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { Header } from "./Header";
import { CookieConsent } from "@/components/public/ui/CookieConsent";
import { ScrollToTop } from "@/components/public/ui";
import { NavSubtabs } from "@/lib/services/navigation";

export interface PublicUserInfo {
    email: string;
}

interface ThemedContentProps {
    children: React.ReactNode;
    navSubtabs?: NavSubtabs;
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
}

function ThemedContent({ children, navSubtabs, registrationOpen, publicUser }: ThemedContentProps) {
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
                    overflowX: "clip",
                    transition: "background-color 0.3s ease-in-out",
                }}
            >
                <Header navSubtabs={navSubtabs} registrationOpen={registrationOpen} publicUser={publicUser} />
                <Box component="main" sx={{ flex: 1 }}>
                    {children}
                </Box>
                <CookieConsent />
                <ScrollToTop />
            </Box>
        </ThemeProvider>
    );
}

interface ThemeWrapperProps {
    children: React.ReactNode;
    navSubtabs?: NavSubtabs;
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
    initialTheme?: "dark" | "light";
}

export function ThemeWrapper({ children, navSubtabs, registrationOpen, publicUser, initialTheme = "dark" }: ThemeWrapperProps) {
    return (
        <ThemeModeProvider initialMode={initialTheme}>
            <ThemedContent navSubtabs={navSubtabs} registrationOpen={registrationOpen} publicUser={publicUser}>{children}</ThemedContent>
        </ThemeModeProvider>
    );
}
