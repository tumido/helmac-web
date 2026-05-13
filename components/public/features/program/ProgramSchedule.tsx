"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { TagFilter } from "./TagFilter";
import { EventCard } from "./EventCard";
import { EventDetailModal } from "./EventDetailModal";
import { ProgramScheduleData, ProgramEvent } from "./program.types";

interface ProgramScheduleProps {
    data: ProgramScheduleData;
    allTags: string[];
}

interface TimeGroup {
    startTime: string;
    events: ProgramEvent[];
}

function groupByStartTime(events: ProgramEvent[]): TimeGroup[] {
    const sorted = [...events].sort((a, b) => {
        if (a.startTime !== b.startTime)
            return a.startTime.localeCompare(b.startTime);
        return 0;
    });

    const groups: TimeGroup[] = [];
    for (const event of sorted) {
        const last = groups[groups.length - 1];
        if (last && last.startTime === event.startTime) {
            last.events.push(event);
        } else {
            groups.push({ startTime: event.startTime, events: [event] });
        }
    }
    return groups;
}

export function ProgramSchedule({ data, allTags }: ProgramScheduleProps) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const selectedDayId =
        tabParam && data.days.some((d) => d.id === tabParam)
            ? tabParam
            : data.days[0]?.id || "";

    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [detailEvent, setDetailEvent] = useState<ProgramEvent | null>(null);

    const selectedDay = data.days.find((day) => day.id === selectedDayId);

    const filteredEvents = useMemo(() => {
        if (!selectedDay) return [];
        if (!selectedTag) return selectedDay.events;
        return selectedDay.events.filter((event) =>
            event.tags.includes(selectedTag)
        );
    }, [selectedDay, selectedTag]);

    const timeGroups = useMemo(
        () => groupByStartTime(filteredEvents),
        [filteredEvents]
    );

    if (data.days.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary">
                    Program zatím není k dispozici.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {allTags.length > 0 && (
                <TagFilter
                    tags={allTags}
                    selectedTag={selectedTag}
                    onTagChange={setSelectedTag}
                />
            )}

            {filteredEvents.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography color="text.secondary">
                        {selectedTag
                            ? `Žádné události s tagem "${selectedTag}" pro tento den.`
                            : "Pro tento den nejsou naplánovány žádné události."}
                    </Typography>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                    }}
                >
                    {timeGroups.map((group) => (
                        <Box
                            key={group.startTime}
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: { xs: 0, sm: 0 },
                            }}
                        >
                            {/* Time label */}
                            <Box
                                sx={{
                                    width: { xs: "auto", sm: 80 },
                                    flexShrink: 0,
                                    pt: { xs: 2, sm: 3 },
                                    pb: { xs: 0.5, sm: 0 },
                                    pl: { xs: 1, sm: 0 },
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "primary.main",
                                        fontWeight: 700,
                                        fontFamily: "monospace",
                                        fontSize: "1.15rem",
                                    }}
                                >
                                    {group.startTime}
                                </Typography>
                            </Box>

                            {/* Events column */}
                            <Box
                                sx={{
                                    flex: 1,
                                    borderLeft: (theme) => ({
                                        xs: "none",
                                        sm: `1px solid ${theme.palette.primary.main}`,
                                    }),
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                {group.events.map((event) => (
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

            <EventDetailModal
                event={detailEvent}
                open={detailEvent !== null}
                onClose={() => setDetailEvent(null)}
            />
        </Box>
    );
}
