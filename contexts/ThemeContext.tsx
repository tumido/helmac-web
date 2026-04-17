"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
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

function setThemeCookie(mode: ThemeMode) {
    document.cookie = `theme-mode=${mode};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

interface ThemeModeProviderProps {
    initialMode: ThemeMode;
    children: ReactNode;
}

export function ThemeModeProvider({ initialMode, children }: ThemeModeProviderProps) {
    const [mode, setMode] = useState<ThemeMode>(initialMode);

    // Sync localStorage preference to cookie on first load (migration)
    useEffect(() => {
        const saved = localStorage.getItem("theme-mode");
        if (saved === "dark" || saved === "light") {
            setThemeCookie(saved);
            if (saved !== initialMode) {
                setMode(saved);
            }
        } else {
            // No localStorage yet - persist the initial mode
            localStorage.setItem("theme-mode", initialMode);
            setThemeCookie(initialMode);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleTheme = useCallback(() => {
        setMode((prev) => {
            const newMode = prev === "dark" ? "light" : "dark";
            localStorage.setItem("theme-mode", newMode);
            setThemeCookie(newMode);
            return newMode;
        });
    }, []);

    return (
        <ThemeContext.Provider
            value={{ mode, toggleTheme, isDark: mode === "dark" }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
