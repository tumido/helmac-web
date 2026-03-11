"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { publicTheme, publicLightTheme } from "@/styles/theme";
import { ThemeModeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { Header } from "./Header";
import { NavSubtabs } from "@/lib/services/navigation";

export interface PublicUserInfo {
    email: string;
    emailVerified: boolean;
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
                    overflowX: "hidden",
                    transition: "background-color 0.3s ease-in-out",
                }}
            >
                <Header navSubtabs={navSubtabs} registrationOpen={registrationOpen} publicUser={publicUser} />
                <Box component="main" sx={{ flex: 1 }}>
                    {children}
                </Box>

            </Box>
        </ThemeProvider>
    );
}

interface ThemeWrapperProps {
    children: React.ReactNode;
    navSubtabs?: NavSubtabs;
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
}

export function ThemeWrapper({ children, navSubtabs, registrationOpen, publicUser }: ThemeWrapperProps) {
    return (
        <ThemeModeProvider>
            <ThemedContent navSubtabs={navSubtabs} registrationOpen={registrationOpen} publicUser={publicUser}>{children}</ThemedContent>
        </ThemeModeProvider>
    );
}
