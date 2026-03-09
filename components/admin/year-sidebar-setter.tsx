"use client";

import { useEffect } from "react";
import { useSidebarContext, type SidebarYearData } from "@/lib/contexts/sidebar-context";

interface YearSidebarSetterProps {
    yearData: SidebarYearData;
    children: React.ReactNode;
}

export function YearSidebarSetter({ yearData, children }: YearSidebarSetterProps) {
    const { setSidebarYear, clearSidebarYear } = useSidebarContext();

    useEffect(() => {
        setSidebarYear(yearData);
        return () => {
            clearSidebarYear();
        };
    }, [yearData, setSidebarYear, clearSidebarYear]);

    return <>{children}</>;
}
