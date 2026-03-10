"use client";

import { usePathname } from "next/navigation";
import {
    Box,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";
import {
    ArrowBack,
    BarChart,
    CalendarMonth,
    Gavel,
    LocalOffer,
    InfoOutlined,
    AppRegistration,
    Description,
    People,
    AccountBalance,
    Settings,
} from "@mui/icons-material";
import { ListItemLinkButton } from "@/components/ui/link-button";
import type { SidebarYearData } from "@/lib/contexts/sidebar-context";

const selectedSx = {
    "&.Mui-selected": {
        backgroundColor: "primary.main",
        color: "primary.contrastText",
        "&:hover": { backgroundColor: "primary.dark" },
        "& .MuiListItemIcon-root": { color: "inherit" },
    },
};

interface YearSidebarProps {
    yearData: SidebarYearData;
    onClose: () => void;
}

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startDay = start.getDate();
    const startMonth = start.getMonth() + 1;
    const endDay = end.getDate();
    const endMonth = end.getMonth() + 1;
    const endYear = end.getFullYear();
    return `${startDay}.${startMonth}. – ${endDay}.${endMonth}.${endYear}`;
}

export function YearSidebar({ yearData, onClose }: YearSidebarProps) {
    const pathname = usePathname();
    const base = `/admin/rocniky/${yearData.id}`;

    const isExactMatch = (href: string) => pathname === href;
    const isPrefixMatch = (href: string) => pathname.startsWith(href + "/") || pathname === href;

    const mainItems = [
        { text: "Přehled", href: base, icon: BarChart, exact: true },
        { text: "Program", href: `${base}/program`, icon: CalendarMonth },
        { text: "Pravidla", href: `${base}/pravidla`, icon: Gavel },
        { text: "Nabídky", href: `${base}/nabidka`, icon: LocalOffer },
        { text: "Info", href: `${base}/info`, icon: InfoOutlined },
    ];

    const registrationItems = [
        { text: "Registrace", href: `${base}/registrace`, icon: AppRegistration, exact: true },
        { text: "Formulář", href: `${base}/registrace/formular`, icon: Description, indented: true },
        { text: "Přihlášky", href: `${base}/registrace/prihlasky`, icon: People, indented: true },
        { text: "Banka", href: `${base}/registrace/banka`, icon: AccountBalance, indented: true },
    ];

    const dateRange = formatDateRange(yearData.startDate, yearData.endDate);

    return (
        <Box>
            {/* Back link */}
            <List disablePadding>
                <ListItem disablePadding>
                    <ListItemLinkButton href="/admin/rocniky" onClick={onClose} sx={{ py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <ArrowBack fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Zpět na ročníky"
                            primaryTypographyProps={{ variant: "body2" }}
                        />
                    </ListItemLinkButton>
                </ListItem>
            </List>
            <Divider />

            {/* Year header */}
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    Ročník {yearData.year} — {yearData.title}
                </Typography>
                {dateRange && (
                    <Typography variant="body2" color="text.secondary">
                        {dateRange}
                    </Typography>
                )}
            </Box>
            <Divider />

            {/* Main navigation */}
            <List>
                {mainItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                        ? isExactMatch(item.href)
                        : isPrefixMatch(item.href);
                    return (
                        <ListItem key={item.href} disablePadding>
                            <ListItemLinkButton
                                href={item.href}
                                selected={isActive}
                                onClick={onClose}
                                sx={selectedSx}
                            >
                                <ListItemIcon><Icon /></ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemLinkButton>
                        </ListItem>
                    );
                })}
            </List>
            <Divider sx={{ mx: 2 }} />

            {/* Registration section */}
            <List>
                {registrationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                        ? isExactMatch(item.href)
                        : isPrefixMatch(item.href);
                    return (
                        <ListItem key={item.href} disablePadding>
                            <ListItemLinkButton
                                href={item.href}
                                selected={isActive}
                                onClick={onClose}
                                sx={{
                                    ...selectedSx,
                                    ...(item.indented ? { pl: 4 } : {}),
                                }}
                            >
                                <ListItemIcon><Icon /></ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemLinkButton>
                        </ListItem>
                    );
                })}
            </List>
            <Divider sx={{ mx: 2 }} />

            {/* Settings */}
            <List>
                <ListItem disablePadding>
                    <ListItemLinkButton
                        href={`${base}/nastaveni`}
                        selected={isPrefixMatch(`${base}/nastaveni`)}
                        onClick={onClose}
                        sx={selectedSx}
                    >
                        <ListItemIcon><Settings /></ListItemIcon>
                        <ListItemText primary="Nastavení" />
                    </ListItemLinkButton>
                </ListItem>
            </List>
        </Box>
    );
}
