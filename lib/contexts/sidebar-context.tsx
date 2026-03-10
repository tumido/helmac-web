"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface SidebarYearData {
    id: string;
    year: number;
    title: string;
    startDate: string | null;
    endDate: string | null;
}

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderData {
    breadcrumbs: BreadcrumbItem[];
    title: string;
}

interface SidebarContextValue {
    sidebarYear: SidebarYearData | null;
    setSidebarYear: (data: SidebarYearData) => void;
    clearSidebarYear: () => void;
    pageHeader: PageHeaderData | null;
    setPageHeader: (breadcrumbs: BreadcrumbItem[], title: string) => void;
    clearPageHeader: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarContextProvider({ children }: { children: ReactNode }) {
    const [sidebarYear, setSidebarYearState] = useState<SidebarYearData | null>(null);
    const [pageHeader, setPageHeaderState] = useState<PageHeaderData | null>(null);

    const setSidebarYear = useCallback((data: SidebarYearData) => {
        setSidebarYearState(data);
    }, []);

    const clearSidebarYear = useCallback(() => {
        setSidebarYearState(null);
    }, []);

    const setPageHeader = useCallback((breadcrumbs: BreadcrumbItem[], title: string) => {
        setPageHeaderState({ breadcrumbs, title });
    }, []);

    const clearPageHeader = useCallback(() => {
        setPageHeaderState(null);
    }, []);

    return (
        <SidebarContext.Provider value={{
            sidebarYear, setSidebarYear, clearSidebarYear,
            pageHeader, setPageHeader, clearPageHeader,
        }}>
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
