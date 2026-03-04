"use client";

import { useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControlLabel,
    Switch,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Add,
    CalendarMonth,
    Edit,
    ExpandMore,
    Gavel,
    InfoOutlined,
    Newspaper,
    PhotoLibrary,
} from "@mui/icons-material";
import { LinkButton, IconLinkButton } from "@/components/ui/link-button";
import { YearForm } from "@/components/forms/year-form";
import { AlbumActions } from "@/components/admin/album-actions";
import { NewsActions } from "@/components/admin/news-actions";
import { SortableRules } from "@/components/admin/sortable-rules";
import { SortableDays } from "@/components/admin/sortable-days";
import { SortableInfo } from "@/components/admin/sortable-info";
import { toggleRegistration, updateRegistrationStartDate } from "@/lib/actions/years";

interface YearEditTabsProps {
    year: {
        id: string;
        year: number;
        title: string;
        subtitle: string | null;
        startDate: Date | null;
        endDate: Date | null;
        headerPhoto: string | null;
        heroPhoto: string | null;
        albums: {
            id: string;
            title: string;
            _count: { images: number };
        }[];
        news: {
            id: string;
            title: string;
            publishedAt: Date | null;
        }[];
        rules: {
            id: string;
            title: string;
        }[];
        programDays: {
            id: string;
            date: Date;
            label: string;
            _count: { events: number };
        }[];
        infoSections: {
            id: string;
            title: string;
        }[];
        registrationOpen: boolean;
        registrationStartDate: Date | null;
    };
}

const TAB_LABELS = ["Rychlé akce", "Správa", "Obsah", "Registrace", "Nastavení"];

export function YearEditTabs({ year }: YearEditTabsProps) {
    const [tab, setTab] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                    value={tab}
                    onChange={(_e, v) => setTab(v)}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                    centered={!isMobile}
                    allowScrollButtonsMobile
                    sx={{
                        "& .MuiTab-root": {
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 600,
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                            textTransform: "none",
                            minWidth: { xs: "auto", sm: 120 },
                            px: { xs: 2, sm: 3 },
                        },
                        "& .Mui-selected": {
                            color: "primary.main",
                        },
                        "& .MuiTabs-indicator": {
                            backgroundColor: "primary.main",
                            height: 3,
                        },
                    }}
                >
                    {TAB_LABELS.map((label) => (
                        <Tab key={label} label={label} />
                    ))}
                </Tabs>
            </Box>

            {/* Tab 0 — Rychle akce */}
            {tab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <LinkButton
                        href={`/admin/galerie/nove?yearId=${year.id}`}
                        variant="contained"
                        startIcon={<PhotoLibrary />}
                    >
                        Nová galerie
                    </LinkButton>
                    <LinkButton
                        href={`/admin/novinky/nova?yearId=${year.id}`}
                        variant="contained"
                        startIcon={<Newspaper />}
                    >
                        Nová novinka
                    </LinkButton>
                    <LinkButton
                        href={`/admin/rocniky/${year.id}/program/novy-den`}
                        variant="contained"
                        startIcon={<CalendarMonth />}
                    >
                        Nový den programu
                    </LinkButton>
                    <LinkButton
                        href={`/admin/rocniky/${year.id}/pravidla/nove`}
                        variant="contained"
                        startIcon={<Gavel />}
                    >
                        Nové pravidlo
                    </LinkButton>
                    <LinkButton
                        href={`/admin/rocniky/${year.id}/info/nove`}
                        variant="contained"
                        startIcon={<InfoOutlined />}
                    >
                        Nová info sekce
                    </LinkButton>
                </Box>
            )}

            {/* Tab 1 — Sprava */}
            {tab === 1 && (
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
            )}

            {/* Tab 2 — Obsah */}
            {tab === 2 && (
                <Box>
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PhotoLibrary fontSize="small" />
                                <Typography variant="h6">Galerie</Typography>
                                <Chip label={year.albums.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.albums.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatím nebyly vytvořeny žádné galerie.
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
                                                <Typography noWrap fontWeight="medium">
                                                    {album.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {album._count.images} obrázků
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Tooltip title="Upravit album">
                                                    <IconLinkButton href={`/admin/galerie/${album.id}`} size="small">
                                                        <Edit />
                                                    </IconLinkButton>
                                                </Tooltip>
                                                <AlbumActions albumId={album.id} />
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
                                    Nová galerie
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Newspaper fontSize="small" />
                                <Typography variant="h6">Novinky</Typography>
                                <Chip label={year.news.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.news.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatím nebyly vytvořeny žádné novinky.
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
                                                <Typography noWrap fontWeight="medium">
                                                    {item.title}
                                                </Typography>
                                                {item.publishedAt && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(item.publishedAt).toLocaleDateString("cs-CZ")}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Tooltip title="Upravit novinku">
                                                    <IconLinkButton href={`/admin/novinky/${item.id}`} size="small">
                                                        <Edit />
                                                    </IconLinkButton>
                                                </Tooltip>
                                                <NewsActions newsId={item.id} />
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
                                    Nová novinka
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Gavel fontSize="small" />
                                <Typography variant="h6">Pravidla</Typography>
                                <Chip label={year.rules.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.rules.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatím nebyla vytvořena žádná pravidla.
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
                                    Nové pravidlo
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CalendarMonth fontSize="small" />
                                <Typography variant="h6">Program</Typography>
                                <Chip label={year.programDays.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.programDays.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatím nebyly vytvořeny žádné dny programu.
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
                                    Nový den
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <InfoOutlined fontSize="small" />
                                <Typography variant="h6">Info</Typography>
                                <Chip label={year.infoSections.length} size="small" />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            {year.infoSections.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                                    Zatím nebyly vytvořeny žádné info sekce.
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
                                    Nová info sekce
                                </LinkButton>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            )}

            {/* Tab 3 — Registrace */}
            {tab === 3 && (
                <RegistrationTab yearId={year.id} registrationOpen={year.registrationOpen} registrationStartDate={year.registrationStartDate} />
            )}

            {/* Tab 4 — Nastaveni */}
            {tab === 4 && (
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
            )}
        </>
    );
}

interface RegistrationTabProps {
    yearId: string;
    registrationOpen: boolean;
    registrationStartDate: Date | null;
}

function RegistrationTab({ yearId, registrationOpen, registrationStartDate }: RegistrationTabProps) {
    const [isOpen, setIsOpen] = useState(registrationOpen);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateValue, setDateValue] = useState(
        registrationStartDate
            ? new Date(registrationStartDate).toISOString().split("T")[0]
            : ""
    );
    const [dateSaving, setDateSaving] = useState(false);

    const handleToggleClick = () => {
        setPendingToggle(!isOpen);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (pendingToggle === null) return;
        setConfirmOpen(false);
        setLoading(true);
        setError(null);

        const result = await toggleRegistration(yearId, pendingToggle);
        if (result.error) {
            setError(typeof result.error === "string" ? result.error : "Chyba");
        } else {
            setIsOpen(pendingToggle);
        }
        setLoading(false);
        setPendingToggle(null);
    };

    const handleCancel = () => {
        setConfirmOpen(false);
        setPendingToggle(null);
    };

    const handleDateBlur = async () => {
        const currentDbDate = registrationStartDate
            ? new Date(registrationStartDate).toISOString().split("T")[0]
            : "";
        if (dateValue === currentDbDate) return;

        setDateSaving(true);
        setError(null);
        const result = await updateRegistrationStartDate(yearId, dateValue || null);
        if (result.error) {
            setError(typeof result.error === "string" ? result.error : "Chyba");
        }
        setDateSaving(false);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 500 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControlLabel
                control={
                    <Switch
                        checked={isOpen}
                        onChange={handleToggleClick}
                        disabled={loading}
                        color="success"
                    />
                }
                label={
                    <Typography fontWeight={600}>
                        {isOpen ? "Registrace otevřena" : "Registrace uzavřena"}
                    </Typography>
                }
            />

            <TextField
                type="date"
                label="Datum otevření registrace"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                onBlur={handleDateBlur}
                disabled={dateSaving}
                helperText="Pokud je registrace uzavřena, na veřejných stránkách se zobrazí datum otevření"
                InputLabelProps={{ shrink: true }}
                fullWidth
            />

            <Dialog open={confirmOpen} onClose={handleCancel}>
                <DialogTitle>
                    {pendingToggle ? "Otevřít registraci?" : "Uzavřít registraci?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {pendingToggle
                            ? "Registrace bude otevřena a návštěvníci se budou moci registrovat na veřejných stránkách."
                            : "Registrace bude uzavřena a registrační formulář nebude dostupný na veřejných stránkách."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>Zrušit</Button>
                    <Button onClick={handleConfirm} variant="contained" autoFocus>
                        Potvrdit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
