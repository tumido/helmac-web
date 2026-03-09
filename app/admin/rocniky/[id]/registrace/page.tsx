import { Container, Typography, Box, Divider } from "@mui/material";
import { Description, People } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { RegistrationSettings } from "@/components/admin/registration-settings";
import { LinkButton } from "@/components/ui/link-button";

interface RegistracePageProps {
    params: Promise<{ id: string }>;
}

async function getYearRegistration(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            registrationOpen: true,
            registrationStartDate: true,
            _count: {
                select: { registrationSubmissions: true },
            },
        },
    });
}

export default async function RegistracePage({ params }: RegistracePageProps) {
    const { id } = await params;
    const year = await getYearRegistration(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace" },
                ]}
            />
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4">Registrace</Typography>
            </Box>

            <RegistrationSettings
                yearId={year.id}
                registrationOpen={year.registrationOpen}
                registrationStartDate={year.registrationStartDate}
                submissionCount={year._count.registrationSubmissions}
            />

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace/formular`}
                    variant="outlined"
                    startIcon={<Description />}
                >
                    Upravit formulář
                </LinkButton>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace/prihlasky`}
                    variant="outlined"
                    startIcon={<People />}
                >
                    Zobrazit přihlášky
                </LinkButton>
            </Box>
        </Container>
    );
}
