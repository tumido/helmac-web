import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Chip,
    Container,
    Divider,
    Tooltip,
    Typography,
    Box,
} from "@mui/material";
import {
    Add,
    CalendarMonth,
    Edit,
    ExpandMore,
    Gavel,
    InfoOutlined,
    PhotoLibrary,
    Newspaper,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";
import { LinkButton, IconLinkButton } from "@/components/ui/link-button";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { YearForm } from "@/components/forms/year-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { AlbumActions } from "@/components/admin/album-actions";
import { NewsActions } from "@/components/admin/news-actions";
import { SortableRules } from "@/components/admin/sortable-rules";
import { SortableDays } from "@/components/admin/sortable-days";
import { SortableInfo } from "@/components/admin/sortable-info";

interface EditYearPageProps {
    params: Promise<{ id: string }>;
}

async function getYear(id: string) {
    return db.year.findUnique({
        where: { id },
        include: {
            albums: {
                orderBy: { sortOrder: "asc" },
                select: {
                    id: true,
                    title: true,
                    isPublished: true,
                    _count: { select: { images: true } },
                },
            },
            news: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    isPublished: true,
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
                {/* Year Info & Settings */}
                <Box>
                    <Box sx={{ mb: 3 }}>
                        {year.subtitle && (
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
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

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6">
                                Nastaveni rocniku
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
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
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PhotoLibrary fontSize="small" />
                                <Typography variant="h6">
                                    Galerie
                                </Typography>
                                <Chip label={year.albums.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.albums.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatim nebyly vytvoreny zadne galerie.
                                </Typography>
                            ) : (
                                year.albums.map((album, index) => (
                                    <Box key={album.id}>
                                        {index > 0 && <Divider />}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                px: 2,
                                                py: 1.5,
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                    <Typography noWrap fontWeight="medium">
                                                        {album.title}
                                                    </Typography>
                                                    <Chip
                                                        label={album.isPublished ? "Publikovano" : "Koncept"}
                                                        size="small"
                                                        color={album.isPublished ? "success" : "default"}
                                                        icon={album.isPublished ? <Visibility /> : <VisibilityOff />}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {album._count.images} obrazku
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Tooltip title="Upravit album">
                                                    <IconLinkButton href={`/admin/galerie/${album.id}`} size="small">
                                                        <Edit />
                                                    </IconLinkButton>
                                                </Tooltip>
                                                <AlbumActions albumId={album.id} isPublished={album.isPublished} />
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}
                            <Divider />
                            <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
                                <LinkButton
                                    href={`/admin/galerie/nove?yearId=${year.id}`}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PhotoLibrary />}
                                >
                                    Nova galerie
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Newspaper fontSize="small" />
                                <Typography variant="h6">
                                    Novinky
                                </Typography>
                                <Chip label={year.news.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.news.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatim nebyly vytvoreny zadne novinky.
                                </Typography>
                            ) : (
                                year.news.map((item, index) => (
                                    <Box key={item.id}>
                                        {index > 0 && <Divider />}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                px: 2,
                                                py: 1.5,
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                    <Typography noWrap fontWeight="medium">
                                                        {item.title}
                                                    </Typography>
                                                    <Chip
                                                        label={item.isPublished ? "Publikovano" : "Koncept"}
                                                        size="small"
                                                        color={item.isPublished ? "success" : "default"}
                                                        icon={item.isPublished ? <Visibility /> : <VisibilityOff />}
                                                    />
                                                </Box>
                                                {item.publishedAt && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {item.publishedAt.toLocaleDateString("cs-CZ")}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Tooltip title="Upravit novinku">
                                                    <IconLinkButton href={`/admin/novinky/${item.id}`} size="small">
                                                        <Edit />
                                                    </IconLinkButton>
                                                </Tooltip>
                                                <NewsActions newsId={item.id} isPublished={item.isPublished} />
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}
                            <Divider />
                            <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
                                <LinkButton
                                    href={`/admin/novinky/nova?yearId=${year.id}`}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Newspaper />}
                                >
                                    Nova novinka
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Gavel fontSize="small" />
                                <Typography variant="h6">
                                    Pravidla
                                </Typography>
                                <Chip label={year.rules.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.rules.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatim nebyla vytvorena zadna pravidla.
                                </Typography>
                            ) : (
                                <SortableRules yearId={year.id} rules={year.rules} />
                            )}
                            <Divider />
                            <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
                                <LinkButton
                                    href={`/admin/rocniky/${year.id}/pravidla/nove`}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Add />}
                                >
                                    Nove pravidlo
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CalendarMonth fontSize="small" />
                                <Typography variant="h6">
                                    Program
                                </Typography>
                                <Chip label={year.programDays.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.programDays.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatim nebyly vytvoreny zadne dny programu.
                                </Typography>
                            ) : (
                                <SortableDays yearId={year.id} days={year.programDays} />
                            )}
                            <Divider />
                            <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
                                <LinkButton
                                    href={`/admin/rocniky/${year.id}/program/novy-den`}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Add />}
                                >
                                    Novy den
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <InfoOutlined fontSize="small" />
                                <Typography variant="h6">
                                    Info
                                </Typography>
                                <Chip label={year.infoSections.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.infoSections.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatim nebyly vytvoreny zadne info sekce.
                                </Typography>
                            ) : (
                                <SortableInfo yearId={year.id} infoSections={year.infoSections} />
                            )}
                            <Divider />
                            <Box sx={{ p: 1.5, display: "flex", justifyContent: "center" }}>
                                <LinkButton
                                    href={`/admin/rocniky/${year.id}/info/nove`}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Add />}
                                >
                                    Nova info sekce
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* Quick Actions */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Rychle akce
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/program/novy-den`}
                            variant="contained"
                            startIcon={<CalendarMonth />}
                        >
                            Novy den programu
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/pravidla/nove`}
                            variant="contained"
                            startIcon={<Gavel />}
                        >
                            Nove pravidlo
                        </LinkButton>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/info/nove`}
                            variant="contained"
                            startIcon={<InfoOutlined />}
                        >
                            Nova info sekce
                        </LinkButton>
                    </Box>
                </Box>

                {/* Upravy */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Upravy
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
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
