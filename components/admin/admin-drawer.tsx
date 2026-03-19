"use client";

import { usePathname } from "next/navigation";
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { signOut } from "next-auth/react";
import { ListItemLinkButton } from "@/components/ui/link-button";
import {
    Dashboard,
    CalendarMonth,
    Today,
    Newspaper,
    PhotoLibrary,
    People,
    PersonOutline,
    Logout,
    Settings,
    PrivacyTip,
} from "@mui/icons-material";
import { useSidebarContext } from "@/lib/contexts/sidebar-context";
import { YearSidebar } from "./year-sidebar";

interface MenuItem {
    text: string;
    href: string;
    icon: React.ComponentType;
    roles?: string[];
    indented?: boolean;
}

interface MenuDivider {
    divider: true;
}

type MenuItemType = MenuItem | MenuDivider;

const staticMenuItems: MenuItemType[] = [
    { text: "Dashboard", href: "/admin", icon: Dashboard },
    { text: "Ročníky", href: "/admin/rocniky", icon: CalendarMonth },
    { text: "Novinky", href: "/admin/novinky", icon: Newspaper },
    { text: "Galerie", href: "/admin/galerie", icon: PhotoLibrary },
    { text: "Účastníci", href: "/admin/ucastnici", icon: PersonOutline, roles: ["SUPER_ADMIN", "ADMIN"] },
    { divider: true },
    {
        text: "Uživatelé",
        href: "/admin/uzivatele",
        icon: People,
        roles: ["SUPER_ADMIN"],
    },
    { divider: true },
    { text: "Nastavení", href: "/admin/nastaveni", icon: Settings },
    { text: "GDPR", href: "/admin/nastaveni/gdpr", icon: PrivacyTip, indented: true },
];

const selectedSx = {
    "&.Mui-selected": {
        backgroundColor: "primary.main",
        color: "primary.contrastText",
        "&:hover": {
            backgroundColor: "primary.dark",
        },
        "& .MuiListItemIcon-root": {
            color: "inherit",
        },
    },
};

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    EDITOR: "Editor",
};

interface AdminDrawerProps {
    width: number;
    mobileOpen: boolean;
    onClose: () => void;
    userRole?: string;
    userName?: string;
    activeYearId?: string;
}

export function AdminDrawer({
    width,
    mobileOpen,
    onClose,
    userRole,
    userName,
    activeYearId,
}: AdminDrawerProps) {
    const pathname = usePathname();
    const { enqueueSnackbar } = useSnackbar();
    const { sidebarYear } = useSidebarContext();

    const activeYearHref = activeYearId
        ? `/admin/rocniky/${activeYearId}`
        : undefined;

    const filteredMenuItems = staticMenuItems.filter((item) => {
        if ("divider" in item) return true;
        if (!item.roles) return true;
        return userRole && item.roles.includes(userRole);
    });

    const handleActiveYearClick = () => {
        if (!activeYearId) {
            enqueueSnackbar("Žádný ročník není aktivní", { variant: "info" });
        }
        onClose();
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/admin/login" });
    };

    const activeYearIsActive = activeYearHref
        ? pathname.startsWith(activeYearHref)
        : false;

    const userSection = (
        <Box>
            <Divider />
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                }}
            >
                <Avatar
                    sx={{
                        width: 32,
                        height: 32,
                        fontSize: "0.85rem",
                        bgcolor: "primary.main",
                    }}
                >
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                        {userName || "Uživatel"}
                    </Typography>
                    {userRole && (
                        <Chip
                            label={ROLE_LABELS[userRole] || userRole}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: "0.65rem", mt: 0.25 }}
                        />
                    )}
                </Box>
                <Tooltip title="Odhlásit">
                    <IconButton size="small" onClick={handleLogout}>
                        <Logout fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    const defaultDrawerContent = (
        <Box>
            <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6" fontWeight="bold">
                    Helmac Admin
                </Typography>
            </Box>
            <Divider />
            <List>
                {filteredMenuItems.map((item, index) => {
                    if ("divider" in item) {
                        return <Divider key={index} sx={{ my: 1 }} />;
                    }

                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin" &&
                            pathname.startsWith(item.href));

                    const elements = [
                        <ListItem key={item.href} disablePadding>
                            <ListItemLinkButton
                                href={item.href}
                                selected={isActive}
                                onClick={onClose}
                                sx={{ ...(item.indented && { pl: 4 }), ...selectedSx }}
                            >
                                <ListItemIcon>
                                    <Icon />
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemLinkButton>
                        </ListItem>,
                    ];

                    if (item.href === "/admin/rocniky") {
                        elements.push(
                            <ListItem key="active-year" disablePadding>
                                {activeYearHref ? (
                                    <ListItemLinkButton
                                        href={activeYearHref}
                                        selected={activeYearIsActive}
                                        onClick={onClose}
                                        sx={{ pl: 4, ...selectedSx }}
                                    >
                                        <ListItemIcon>
                                            <Today />
                                        </ListItemIcon>
                                        <ListItemText primary="Aktuální ročník" />
                                    </ListItemLinkButton>
                                ) : (
                                    <ListItemButton
                                        onClick={handleActiveYearClick}
                                        sx={{ pl: 4, ...selectedSx }}
                                    >
                                        <ListItemIcon>
                                            <Today />
                                        </ListItemIcon>
                                        <ListItemText primary="Aktuální ročník" />
                                    </ListItemButton>
                                )}
                            </ListItem>,
                        );
                    }

                    return elements;
                })}
            </List>
        </Box>
    );

    const sidebarContent = sidebarYear
        ? <YearSidebar yearData={sidebarYear} onClose={onClose} />
        : defaultDrawerContent;

    const drawerContent = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ flex: 1, overflow: "auto" }}>
                {sidebarContent}
            </Box>
            {userSection}
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { md: width }, flexShrink: { md: 0 } }}
        >
            {/* Mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": { width },
                }}
            >
                {drawerContent}
            </Drawer>
            {/* Desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", md: "block" },
                    "& .MuiDrawer-paper": { width, boxSizing: "border-box" },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
