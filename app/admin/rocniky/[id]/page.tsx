import {
    Container,
    Typography,
    Box,
} from "@mui/material";
import {
    CalendarMonth,
    Gavel,
    InfoOutlined,
    PhotoLibrary,
    Newspaper,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { YearForm } from "@/components/forms/year-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
    });
}

export default async function EditYearPage({ params }: EditYearPageProps) {
    const { id } = await params;
    const year = await getYear(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <AdminBreadcrumbs
                items={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year} - ${year.title}` },
                ]}
            />
            <Typography variant="h4" sx={{ mb: 4 }}>
                Rocnik {year.year} - {year.title}
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                    gap: 4,
                }}
            >
                {/* Year Settings */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Nastaveni rocniku
                    </Typography>
                    <YearForm
                        mode="edit"
                        yearId={year.id}
                        defaultValues={{
                            year: year.year,
                            title: year.title,
                            subtitle: year.subtitle,
                            startDate: year.startDate,
                            endDate: year.endDate,
                            headerPhoto: year.headerPhoto,
                            heroPhoto: year.heroPhoto,
                        }}
                    />
                </Box>

                {/* Quick Actions */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Rychle akce
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/program`}
                            variant="contained"
                            startIcon={<CalendarMonth />}
                        >
                            Spravovat program
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/pravidla`}
                            variant="contained"
                            startIcon={<Gavel />}
                        >
                            Spravovat pravidla
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/info`}
                            variant="contained"
                            startIcon={<InfoOutlined />}
                        >
                            Spravovat info
                        </LinkButton>
                        <LinkButton
                            href={`/admin/galerie/nove?yearId=${year.id}`}
                            variant="contained"
                            startIcon={<PhotoLibrary />}
                        >
                            Nova galerie
                        </LinkButton>
                        <LinkButton
                            href={`/admin/novinky/nova?yearId=${year.id}`}
                            variant="contained"
                            startIcon={<Newspaper />}
                        >
                            Nova novinka
                        </LinkButton>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
