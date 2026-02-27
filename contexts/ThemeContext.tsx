"use client";

import {
    createContext,
    useContext,
    useSyncExternalStore,
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

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
}

function getSnapshot(): ThemeMode {
    const saved = localStorage.getItem("theme-mode");
    return saved === "dark" || saved === "light" ? saved : "dark";
}

function getServerSnapshot(): ThemeMode {
    return "dark";
}

interface ThemeModeProviderProps {
    children: ReactNode;
}

export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
    const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggleTheme = () => {
        const newMode = mode === "dark" ? "light" : "dark";
        localStorage.setItem("theme-mode", newMode);
        listeners.forEach((l) => l());
    };

    return (
        <ThemeContext.Provider
            value={{ mode, toggleTheme, isDark: mode === "dark" }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
