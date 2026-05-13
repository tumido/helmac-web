"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { publicTheme, publicLightTheme } from "@/styles/theme";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { Header } from "./Header";
import { Footer, FooterDates } from "./Footer";
import { CookieConsent } from "@/components/public/ui/CookieConsent";
import { ScrollToTop } from "@/components/public/ui";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { NavigationData } from "@/lib/services/navigation";

export interface PublicUserInfo {
    email: string;
}

interface ThemedContentProps {
    children: React.ReactNode;
    navigationData?: NavigationData;
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
    footerDates?: FooterDates | null;
}

function ThemedContent({
    children,
    navigationData,
    registrationOpen,
    publicUser,
    footerDates,
}: ThemedContentProps) {
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
                <Header
                    navigationData={navigationData}
                    registrationOpen={registrationOpen}
                    publicUser={publicUser}
                />
                <Box component="main" sx={{ flex: 1 }}>
                    {children}
                </Box>
                <Container maxWidth="lg">
                    <OrnamentalUnderline sx={{ mt: 0, mx: { xs: 1, sm: 0 } }} />
                </Container>
                <Footer dates={footerDates} navigationData={navigationData} />
                <CookieConsent />
                <ScrollToTop />
            </Box>
        </ThemeProvider>
    );
}

interface ThemeWrapperProps {
    children: React.ReactNode;
    navigationData?: NavigationData;
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
    initialTheme?: "dark" | "light";
    footerDates?: FooterDates | null;
}

export function ThemeWrapper({
    children,
    navigationData,
    registrationOpen,
    publicUser,
    initialTheme = "dark",
    footerDates,
}: ThemeWrapperProps) {
    return (
        <ThemeModeProvider initialMode={initialTheme}>
            <ThemedContent
                navigationData={navigationData}
                registrationOpen={registrationOpen}
                publicUser={publicUser}
                footerDates={footerDates}
            >
                {children}
            </ThemedContent>
        </ThemeModeProvider>
    );
}
