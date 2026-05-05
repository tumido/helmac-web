"use client";

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { Edit, AccessTime, Place } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { ProgramEventActions } from "@/components/admin/program-event-actions";
import { reorderProgramEvents } from "@/lib/actions/program-events";
import { useToast } from "@/lib/hooks/use-toast";

interface Event {
    id: string;
    startTime: string;
    title: string;
    location: string;
    tags: string[];
}

interface SortableEventsProps {
    yearId: string;
    dayId: string;
    events: Event[];
}

export function SortableEvents({ yearId, dayId, events }: SortableEventsProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderProgramEvents(dayId, newOrder);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí událostí bylo změněno");
        }
    };

    return (
        <SortableList
            items={events}
            getId={(event) => event.id}
            onReorder={handleReorder}
            renderItem={(event) => (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        flex: 1,
                        py: 1,
                        pr: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            minWidth: 60,
                            color: "text.secondary",
                        }}
                    >
                        <AccessTime fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                            {event.startTime}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography fontWeight="medium">
                                {event.title}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "text.secondary",
                                mt: 0.5,
                            }}
                        >
                            <Place fontSize="small" />
                            <Typography variant="body2">
                                {event.location}
                            </Typography>
                        </Box>
                        {event.tags.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                    mt: 1,
                                }}
                            >
                                {event.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="Upravit událost">
                            <IconLinkButton
                                href={`/admin/rocniky/${yearId}/program/${dayId}/${event.id}`}
                                size="small"
                            >
                                <Edit />
                            </IconLinkButton>
                        </Tooltip>
                        <ProgramEventActions eventId={event.id} />
                    </Box>
                </Box>
            )}
        />
    );
}
