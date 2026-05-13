"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DayTabs } from "./DayTabs";

interface ProgramDayTabsNavProps {
    days: { id: string; label: string }[];
}

export function ProgramDayTabsNav({ days }: ProgramDayTabsNavProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const selectedDayId =
        tabParam && days.some((d) => d.id === tabParam)
            ? tabParam
            : days[0]?.id || "";

    const handleDayChange = (dayId: string) => {
        router.replace(`${pathname}?tab=${dayId}`, {
            scroll: false,
        });
    };

    if (days.length === 0) return null;

    return (
        <DayTabs
            days={days}
            selectedDayId={selectedDayId}
            onDayChange={handleDayChange}
        />
    );
}
