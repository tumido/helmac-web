"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useThemeMode must be used within ThemeModeProvider");
    }
    return context;
}

interface ThemeModeProviderProps {
    children: ReactNode;
}

export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
    const [mode, setMode] = useState<ThemeMode>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("theme-mode") as ThemeMode;
        if (saved && (saved === "dark" || saved === "light")) {
            setMode(saved);
        }
    }, []);

    const toggleTheme = () => {
        const newMode = mode === "dark" ? "light" : "dark";
        setMode(newMode);
        localStorage.setItem("theme-mode", newMode);
    };

    // Prevent hydration mismatch by returning dark mode on server
    if (!mounted) {
        return (
            <ThemeContext.Provider
                value={{ mode: "dark", toggleTheme: () => {}, isDark: true }}
            >
                {children}
            </ThemeContext.Provider>
        );
    }

    return (
        <ThemeContext.Provider
            value={{ mode, toggleTheme, isDark: mode === "dark" }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
