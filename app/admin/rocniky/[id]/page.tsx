import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
} from "@mui/material";
import {
    Add,
    CalendarMonth,
} from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { YearForm } from "@/components/forms/year-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { SortablePages } from "@/components/admin/sortable-pages";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYearWithPages(id: string) {
    return db.year.findUnique({
        where: { id },
        include: {
            pages: {
                orderBy: { sortOrder: "asc" },
            },
        },
    });
}

export default async function EditYearPage({ params }: EditYearPageProps) {
    const { id } = await params;
    const year = await getYearWithPages(id);

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
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                    }}
                >
                    <Typography variant="h4">
                        Rocnik {year.year} - {year.title}
                    </Typography>
                    <LinkButton
                        href={`/admin/rocniky/${year.id}/program`}
                        variant="contained"
                        startIcon={<CalendarMonth />}
                    >
                        Spravovat program
                    </LinkButton>
                </Box>
            </Box>

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
                        }}
                    />
                </Box>

                {/* Pages List */}
                <Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">Stranky</Typography>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/stranky/nova`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nova stranka
                        </LinkButton>
                    </Box>

                    {year.pages.length === 0 ? (
                        <Card>
                            <CardContent>
                                <Typography
                                    color="text.secondary"
                                    textAlign="center"
                                >
                                    Zatim nebyly vytvoreny zadne stranky.
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <SortablePages yearId={year.id} pages={year.pages} />
                    )}
                </Box>
            </Box>
        </Container>
    );
}
