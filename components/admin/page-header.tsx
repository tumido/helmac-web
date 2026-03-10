"use client";

import { useEffect } from "react";
import { useSidebarContext, type BreadcrumbItem } from "@/lib/contexts/sidebar-context";

interface PageHeaderProps {
    breadcrumbs: BreadcrumbItem[];
    title: string;
}

export function PageHeader({ breadcrumbs, title }: PageHeaderProps) {
    const { setPageHeader, clearPageHeader } = useSidebarContext();

    useEffect(() => {
        setPageHeader(breadcrumbs, title);
        return () => {
            clearPageHeader();
        };
    }, [breadcrumbs, title, setPageHeader, clearPageHeader]);

    return null;
}
