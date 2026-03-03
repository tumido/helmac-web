import { Suspense } from "react";
import { Container, Typography } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { ProgramSchedule } from "@/components/public/features/program";
import {
    getProgramScheduleForActiveYear,
    getAllPublishedTags,
} from "@/lib/services/program";
import { getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Program | Helmac",
    description: "Program akce Helmac - kompletni harmonogram udalosti a aktivit",
};

export default async function ProgramPage() {
    const [scheduleData, allTags, activeYear] = await Promise.all([
        getProgramScheduleForActiveYear(),
        getAllPublishedTags(),
        getActiveYear(),
    ]);

    return (
        <>
            <PageHeader
                title="Program"
                subtitle="Kompletni harmonogram akce"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
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
                        Program zatim neni k dispozici.
                    </Typography>
                )}
            </Container>
        </>
    );
}
