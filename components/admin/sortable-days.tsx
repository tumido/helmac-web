"use client";

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { Edit, CalendarMonth, Event } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { ProgramDayActions } from "@/components/admin/program-day-actions";
import { reorderProgramDays } from "@/lib/actions/program-days";
import { useToast } from "@/lib/hooks/use-toast";

interface Day {
    id: string;
    date: Date;
    label: string;
    _count: {
        events: number;
    };
}

interface SortableDaysProps {
    yearId: string;
    days: Day[];
}

import { formatDate } from "@/lib/utils/date";

export function SortableDays({ yearId, days }: SortableDaysProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderProgramDays(yearId, newOrder);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí dnů bylo změněno");
        }
    };

    return (
        <SortableList
            items={days}
            getId={(day) => day.id}
            onReorder={handleReorder}
            renderItem={(day) => (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                        py: 1,
                        pr: 1,
                    }}
                >
                    <CalendarMonth sx={{ color: "text.disabled" }} />
                    <Box sx={{ flex: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Typography fontWeight="medium">
                                {day.label}
                            </Typography>
                            <Chip
                                label={formatDate(day.date)}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "text.secondary",
                            }}
                        >
                            <Event fontSize="small" />
                            <Typography variant="body2">
                                {day._count.events}{" "}
                                {day._count.events === 1
                                    ? "udalost"
                                    : day._count.events < 5
                                      ? "udalosti"
                                      : "udalosti"}
                            </Typography>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="Spravovat den">
                            <IconLinkButton
                                href={`/admin/rocniky/${yearId}/program/${day.id}`}
                                size="small"
                            >
                                <Edit />
                            </IconLinkButton>
                        </Tooltip>
                        <ProgramDayActions
                            dayId={day.id}
                            eventsCount={day._count.events}
                        />
                    </Box>
                </Box>
            )}
        />
    );
}
