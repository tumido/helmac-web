import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { YearEditTabs } from "@/components/admin/year-edit-tabs";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            subtitle: true,
            startDate: true,
            endDate: true,
            headerPhoto: true,
            heroPhoto: true,
            registrationOpen: true,
            registrationStartDate: true,
            registrationForm: {
                select: { id: true, fields: true },
            },
            _count: {
                select: { registrationSubmissions: true },
            },
            albums: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                    _count: { select: { images: true } },
                },
            },
            news: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    publishedAt: true,
                },
            },
            rules: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                },
            },
            offers: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                },
            },
            programDays: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    date: true,
                    label: true,
                    _count: { select: { events: true } },
                },
            },
            infoSections: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                },
            },
        },
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
            <Typography variant="h4" sx={{ mb: 1 }}>
                Rocnik {year.year} - {year.title}
            </Typography>
            <Box sx={{ mb: 3 }}>
                {year.subtitle && (
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                        {year.subtitle}
                    </Typography>
                )}
                {year.startDate && year.endDate && (
                    <Typography variant="body2" color="text.secondary">
                        {year.startDate.toLocaleDateString("cs-CZ")}
                        {" - "}
                        {year.endDate.toLocaleDateString("cs-CZ")}
                    </Typography>
                )}
            </Box>
            <YearEditTabs year={year} />
        </Container>
    );
}
