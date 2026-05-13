"use client";

import { Box, ButtonBase, Chip, Tooltip, Typography } from "@mui/material";
import { Add, Edit, AccessTime, Place } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { ProgramEventActions } from "@/components/admin/program-event-actions";
import { reorderProgramEvents } from "@/lib/actions/program-events";
import { useToast } from "@/lib/hooks/use-toast";
import { builderPalette as p } from "@/components/admin/email-builder/palette";
import Link from "next/link";

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

export function SortableEvents({
    yearId,
    dayId,
    events,
}: SortableEventsProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderProgramEvents(
            dayId,
            newOrder
        );
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí událostí bylo změněno");
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: p.surface,
                border: `1px solid ${p.line}`,
                borderRadius: "14px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* head */}
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: `1px solid ${p.line}`,
                    background: `linear-gradient(180deg, ${p.surface}, ${p.surface2})`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <Typography
                    sx={{
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: p.ink3,
                        fontWeight: 700,
                        flex: 1,
                    }}
                    noWrap
                >
                    Události
                </Typography>
                <Box
                    sx={{
                        fontFamily:
                            "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: p.ink2,
                        backgroundColor: p.surface3,
                        px: "7px",
                        py: "2px",
                        borderRadius: "6px",
                    }}
                >
                    {events.length}
                </Box>
            </Box>

            {/* body */}
            <Box
                sx={{
                    flex: 1,
                    p: "8px",
                    backgroundColor: p.surface2,
                    minHeight: 48,
                }}
            >
                {events.length === 0 ? (
                    <Typography
                        sx={{
                            fontSize: 12.5,
                            color: p.ink3,
                            textAlign: "center",
                            py: 3,
                        }}
                    >
                        Žádné události
                    </Typography>
                ) : (
                    <SortableList
                        items={events}
                        getId={(event) => event.id}
                        onReorder={handleReorder}
                        renderItem={(event) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1.5,
                                    flex: 1,
                                    py: 0.75,
                                    pr: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        minWidth: 55,
                                        color: p.ink3,
                                    }}
                                >
                                    <AccessTime
                                        sx={{ fontSize: 14 }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                        }}
                                    >
                                        {event.startTime}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: p.ink,
                                        }}
                                        noWrap
                                    >
                                        {event.title}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems:
                                                "center",
                                            gap: 0.5,
                                            color: p.ink3,
                                            mt: 0.25,
                                        }}
                                    >
                                        <Place
                                            sx={{
                                                fontSize: 14,
                                            }}
                                        />
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                            }}
                                        >
                                            {event.location}
                                        </Typography>
                                    </Box>
                                    {event.tags.length >
                                        0 && (
                                        <Box
                                            sx={{
                                                display:
                                                    "flex",
                                                gap: 0.5,
                                                flexWrap:
                                                    "wrap",
                                                mt: 0.75,
                                            }}
                                        >
                                            {event.tags.map(
                                                (tag) => (
                                                    <Chip
                                                        key={
                                                            tag
                                                        }
                                                        label={
                                                            tag
                                                        }
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: 11,
                                                            borderColor:
                                                                p.line,
                                                            color: p.ink2,
                                                        }}
                                                    />
                                                )
                                            )}
                                        </Box>
                                    )}
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        gap: 0.25,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Tooltip title="Upravit událost">
                                        <IconLinkButton
                                            href={`/admin/rocniky/${yearId}/program/${dayId}/${event.id}`}
                                            size="small"
                                            sx={{
                                                color: p.ink3,
                                                "&:hover":
                                                    {
                                                        color: p.indigo,
                                                    },
                                            }}
                                        >
                                            <Edit
                                                sx={{
                                                    fontSize: 16,
                                                }}
                                            />
                                        </IconLinkButton>
                                    </Tooltip>
                                    <ProgramEventActions
                                        eventId={
                                            event.id
                                        }
                                    />
                                </Box>
                            </Box>
                        )}
                    />
                )}
            </Box>

            {/* foot */}
            <Box
                sx={{
                    p: "10px",
                    borderTop: `1px solid ${p.line}`,
                    backgroundColor: p.surface2,
                }}
            >
                <ButtonBase
                    component={Link}
                    href={`/admin/rocniky/${yearId}/program/${dayId}/nova-udalost`}
                    sx={{
                        width: "100%",
                        py: "10px",
                        px: "12px",
                        backgroundColor: p.surface,
                        border: `1px dashed ${p.line}`,
                        borderRadius: "10px",
                        color: p.indigo,
                        fontSize: 13,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 140ms ease",
                        "&:hover": {
                            borderColor: p.indigo,
                            backgroundColor: p.indigoSoft,
                        },
                    }}
                >
                    <Add sx={{ fontSize: 16 }} />
                    Nová událost
                </ButtonBase>
            </Box>
        </Box>
    );
}
