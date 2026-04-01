"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { DayTabs } from "./DayTabs";
import { TagFilter } from "./TagFilter";
import { TimeSection } from "./TimeSection";
import { EventCard } from "./EventCard";
import { EventDetailModal } from "./EventDetailModal";
import {
    ProgramScheduleData,
    ProgramEvent,
    TimeOfDay,
    getTimeOfDay,
} from "./program.types";

interface ProgramScheduleProps {
    data: ProgramScheduleData;
    allTags: string[];
}

interface GroupedEvents {
    morning: ProgramEvent[];
    afternoon: ProgramEvent[];
    evening: ProgramEvent[];
}

export function ProgramSchedule({ data, allTags }: ProgramScheduleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const initialDayId = (tabParam && data.days.some((d) => d.id === tabParam))
        ? tabParam
        : data.days[0]?.id || "";

    const [selectedDayId, setSelectedDayId] = useState(initialDayId);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useEffect(() => {
        if (tabParam && data.days.some((d) => d.id === tabParam)) {
            setSelectedDayId(tabParam);
        }
    }, [tabParam]);

    const handleDayChange = (dayId: string) => {
        setSelectedDayId(dayId);
        router.replace(`${pathname}?tab=${dayId}`, { scroll: false });
    };
    const [detailEvent, setDetailEvent] = useState<ProgramEvent | null>(null);

    const selectedDay = data.days.find((day) => day.id === selectedDayId);

    const filteredEvents = useMemo(() => {
        if (!selectedDay) return [];
        if (!selectedTag) return selectedDay.events;
        return selectedDay.events.filter((event) =>
            event.tags.includes(selectedTag)
        );
    }, [selectedDay, selectedTag]);

    const groupedEvents = useMemo((): GroupedEvents => {
        const groups: GroupedEvents = {
            morning: [],
            afternoon: [],
            evening: [],
        };

        filteredEvents.forEach((event) => {
            const timeOfDay = getTimeOfDay(event.startTime);
            groups[timeOfDay].push(event);
        });

        return groups;
    }, [filteredEvents]);

    const timeGroups: TimeOfDay[] = ["morning", "afternoon", "evening"];
    const nonEmptyGroups = timeGroups.filter(
        (group) => groupedEvents[group].length > 0
    );

    if (data.days.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary">
                    Program zatim neni k dispozici.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Day Tabs */}
            <DayTabs
                days={data.days}
                selectedDayId={selectedDayId}
                onDayChange={handleDayChange}
            />

            {/* Tag Filter */}
            {allTags.length > 0 && (
                <TagFilter
                    tags={allTags}
                    selectedTag={selectedTag}
                    onTagChange={setSelectedTag}
                />
            )}

            {/* Events */}
            {filteredEvents.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography color="text.secondary">
                        {selectedTag
                            ? `Zadne udalosti s tagem "${selectedTag}" pro tento den.`
                            : "Pro tento den nejsou naplavnovany zadne udalosti."}
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {nonEmptyGroups.map((timeOfDay) => (
                        <Box key={timeOfDay}>
                            <TimeSection timeOfDay={timeOfDay} />
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                    ml: { xs: 1, sm: "10px" },
                                }}
                            >
                                {groupedEvents[timeOfDay].map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onOpenDetails={() =>
                                            setDetailEvent(event)
                                        }
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Detail Modal */}
            <EventDetailModal
                event={detailEvent}
                open={detailEvent !== null}
                onClose={() => setDetailEvent(null)}
            />
        </Box>
    );
}
