"use client";

import { createContext, useContext, useState } from "react";
import { Chip } from "@mui/material";

interface SubmissionsCountContextValue {
    displayedCount: number | null;
    setDisplayedCount: (count: number | null) => void;
}

const SubmissionsCountContext = createContext<SubmissionsCountContextValue | null>(null);

export function SubmissionsCountProvider({ children }: { children: React.ReactNode }) {
    const [displayedCount, setDisplayedCount] = useState<number | null>(null);
    return (
        <SubmissionsCountContext.Provider value={{ displayedCount, setDisplayedCount }}>
            {children}
        </SubmissionsCountContext.Provider>
    );
}

export function useSubmissionsCount(): SubmissionsCountContextValue {
    const ctx = useContext(SubmissionsCountContext);
    if (!ctx) {
        throw new Error("useSubmissionsCount must be used within a SubmissionsCountProvider");
    }
    return ctx;
}

export function SubmissionsCountChip({ total }: { total: number }) {
    const { displayedCount } = useSubmissionsCount();
    let label: string;
    if (displayedCount != null && displayedCount < total) {
        label = displayedCount === 0
            ? `Žádná z ${total} registrací`
            : `splňuje ${displayedCount} z ${total} registrací`;
    } else {
        label = `${total} registrací`;
    }
    return <Chip label={label} color="primary" variant="outlined" />;
}
