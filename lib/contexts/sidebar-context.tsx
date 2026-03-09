"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface SidebarYearData {
    id: string;
    year: number;
    title: string;
    startDate: string | null;
    endDate: string | null;
}

interface SidebarContextValue {
    sidebarYear: SidebarYearData | null;
    setSidebarYear: (data: SidebarYearData) => void;
    clearSidebarYear: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarContextProvider({ children }: { children: ReactNode }) {
    const [sidebarYear, setSidebarYearState] = useState<SidebarYearData | null>(null);

    const setSidebarYear = useCallback((data: SidebarYearData) => {
        setSidebarYearState(data);
    }, []);

    const clearSidebarYear = useCallback(() => {
        setSidebarYearState(null);
    }, []);

    return (
        <SidebarContext.Provider value={{ sidebarYear, setSidebarYear, clearSidebarYear }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebarContext() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebarContext must be used within SidebarContextProvider");
    }
    return context;
}
