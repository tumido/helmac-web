import {
    Container,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tooltip,
    Divider,
} from "@mui/material";
import {
    ArrowBack,
    Edit,
    Add,
    Visibility,
    VisibilityOff,
    DragIndicator,
} from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { YearForm } from "@/components/forms/year-form";
import { PageActions } from "@/components/admin/page-actions";

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
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href="/admin/rocniky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocniky
                </Button>
                <Typography variant="h4">
                    Rocnik {year.year} - {year.title}
                </Typography>
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
                        <Button
                            component={Link}
                            href={`/admin/rocniky/${year.id}/stranky/nova`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                        >
                            Nova stranka
                        </Button>
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
                        <Card>
                            {year.pages.map((page, index) => (
                                <Box key={page.id}>
                                    {index > 0 && <Divider />}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                            p: 2,
                                        }}
                                    >
                                        <DragIndicator
                                            sx={{ color: "text.disabled" }}
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography fontWeight="medium">
                                                    {page.title}
                                                </Typography>
                                                <Chip
                                                    label={
                                                        page.isPublished
                                                            ? "Publikovano"
                                                            : "Skryto"
                                                    }
                                                    size="small"
                                                    color={
                                                        page.isPublished
                                                            ? "success"
                                                            : "default"
                                                    }
                                                    icon={
                                                        page.isPublished ? (
                                                            <Visibility />
                                                        ) : (
                                                            <VisibilityOff />
                                                        )
                                                    }
                                                />
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                /{page.slug}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                            }}
                                        >
                                            <Tooltip title="Upravit stranku">
                                                <IconButton
                                                    component={Link}
                                                    href={`/admin/rocniky/${year.id}/stranky/${page.id}`}
                                                    size="small"
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <PageActions
                                                pageId={page.id}
                                                isPublished={page.isPublished}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Card>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
