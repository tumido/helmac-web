import { Prisma } from "@prisma/client";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface ActionButton {
    label: string;
    url: string;
    variant?: "contained" | "outlined" | "text";
}

export interface ProgramEvent {
    id: string;
    startTime: string;
    endTime: string | null;
    title: string;
    description: string;
    location: string;
    imageUrl: string | null;
    tags: string[];
    storyContent: Prisma.JsonValue;
    actionButtons: ActionButton[];
}

export interface ProgramDay {
    id: string;
    date: Date;
    label: string;
    sortOrder: number;
    events: ProgramEvent[];
}

export interface ProgramScheduleData {
    yearId: string;
    days: ProgramDay[];
}

export function getTimeOfDay(startTime: string): TimeOfDay {
    const [hours] = startTime.split(":").map(Number);
    if (hours < 12) return "morning";
    if (hours < 17) return "afternoon";
    return "evening";
}

export function getTimeOfDayLabel(timeOfDay: TimeOfDay): string {
    switch (timeOfDay) {
        case "morning":
            return "Dopoledne";
        case "afternoon":
            return "Odpoledne";
        case "evening":
            return "Vecer";
    }
}
