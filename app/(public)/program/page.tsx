import { Suspense } from "react";
import { Container, Typography } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import {
    ProgramSchedule,
    ProgramDayTabsNav,
} from "@/components/public/features/program";
import type { ProgramScheduleData } from "@/components/public/features/program";
import type { ActionButton } from "@/components/public/features/program/program.types";
import {
    getProgramScheduleForActiveYear,
    getAllPublishedTags,
} from "@/lib/services/program";

export const metadata = {
    title: "Program | Helmáč",
    description: "Program akce Helmáč - kompletní harmonogram událostí a aktivit",
};

export default async function ProgramPage() {
    const [rawSchedule, allTags] = await Promise.all([
        getProgramScheduleForActiveYear(),
        getAllPublishedTags(),
    ]);

    const scheduleData: ProgramScheduleData | null = rawSchedule
        ? {
              ...rawSchedule,
              days: rawSchedule.days.map((day) => ({
                  ...day,
                  events: day.events.map((event) => ({
                      ...event,
                      actionButtons:
                          (event.actionButtons as unknown as ActionButton[]) ??
                          [],
                  })),
              })),
          }
        : null;

    return (
        <>
            <PageHeader
                title="Program"
                subtitle="Kompletní harmonogram akce"
                icon="sundial"
            >
                {scheduleData && scheduleData.days.length > 0 && (
                    <Suspense>
                        <ProgramDayTabsNav days={scheduleData.days} />
                    </Suspense>
                )}
            </PageHeader>
            <Container
                maxWidth="lg"
                sx={{ pb: 8, px: { lg: "220px" } }}
            >
                {scheduleData && scheduleData.days.length > 0 ? (
                    <Suspense>
                        <ProgramSchedule data={scheduleData} allTags={allTags} />
                    </Suspense>
                ) : (
                    <Typography
                        color="text.secondary"
                        textAlign="center"
                        sx={{ py: 8 }}
                    >
                        Program zatím není k dispozici.
                    </Typography>
                )}
            </Container>
        </>
    );
}
