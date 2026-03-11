import {
    Container,
    Typography,
    Paper,
    Chip,
} from "@mui/material";
import {
    AppRegistration,
} from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYearOverview(id: string) {
    return db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            registrationOpen: true,
            _count: {
                select: {
                    registrationSubmissions: true,
                },
            },
        },
    });
}

export default async function EditYearPage({ params }: EditYearPageProps) {
    const { id } = await params;
    const year = await getYearOverview(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}` },
                ]}
                title="Přehled"
            />

            {/* Registration status banner */}
            <Paper
                sx={{
                    p: 2,
                    mb: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <AppRegistration color={year.registrationOpen ? "success" : "disabled"} />
                <Typography variant="body1" sx={{ flex: 1 }}>
                    Registrace je{" "}
                    <strong>{year.registrationOpen ? "otevřena" : "uzavřena"}</strong>
                </Typography>
                <Chip
                    label={`${year._count.registrationSubmissions} přihlášek`}
                    color="primary"
                    variant="outlined"
                    size="small"
                />
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace`}
                    variant="outlined"
                    size="small"
                >
                    Spravovat
                </LinkButton>
            </Paper>
        </Container>
    );
}
