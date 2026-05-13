"use client";

import { Box, ButtonBase, Chip, Tooltip, Typography } from "@mui/material";
import { Add, Edit, CalendarMonth, Event } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { ProgramDayActions } from "@/components/admin/program-day-actions";
import { reorderProgramDays } from "@/lib/actions/program-days";
import { useToast } from "@/lib/hooks/use-toast";
import { builderPalette as p } from "@/components/admin/email-builder/palette";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

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
                    Dny programu
                </Typography>
                <Box
                    sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: p.ink2,
                        backgroundColor: p.surface3,
                        px: "7px",
                        py: "2px",
                        borderRadius: "6px",
                    }}
                >
                    {days.length}
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
                {days.length === 0 ? (
                    <Typography
                        sx={{
                            fontSize: 12.5,
                            color: p.ink3,
                            textAlign: "center",
                            py: 3,
                        }}
                    >
                        Žádné dny programu
                    </Typography>
                ) : (
                    <SortableList
                        items={days}
                        getId={(day) => day.id}
                        onReorder={handleReorder}
                        renderItem={(day) => (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    flex: 1,
                                    py: 0.75,
                                    pr: 1,
                                }}
                            >
                                <CalendarMonth
                                    sx={{
                                        color: p.ink3,
                                        fontSize: 18,
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
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
                                            color: p.ink3,
                                        }}
                                    >
                                        <Event
                                            sx={{ fontSize: 14 }}
                                        />
                                        <Typography
                                            sx={{ fontSize: 12 }}
                                        >
                                            {day._count.events}{" "}
                                            {day._count.events === 1
                                                ? "udalost"
                                                : day._count
                                                          .events < 5
                                                  ? "udalosti"
                                                  : "udalosti"}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.25,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Tooltip title="Spravovat den">
                                        <IconLinkButton
                                            href={`/admin/rocniky/${yearId}/program/${day.id}`}
                                            size="small"
                                            sx={{
                                                color: p.ink3,
                                                "&:hover": {
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
                                    <ProgramDayActions
                                        dayId={day.id}
                                        eventsCount={
                                            day._count.events
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
                    href={`/admin/rocniky/${yearId}/program/novy-den`}
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
                    Přidat den
                </ButtonBase>
            </Box>
        </Box>
    );
}
