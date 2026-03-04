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
} from "@mui/material";
import { useSnackbar } from "notistack";
import { ListItemLinkButton } from "@/components/ui/link-button";
import {
    Dashboard,
    CalendarMonth,
    Today,
    Newspaper,
    PhotoLibrary,
    People,
} from "@mui/icons-material";

interface MenuItem {
    text: string;
    href: string;
    icon: React.ComponentType;
    roles?: string[];
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
    { divider: true },
    {
        text: "Uživatelé",
        href: "/admin/uzivatele",
        icon: People,
        roles: ["SUPER_ADMIN"],
    },
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

interface AdminDrawerProps {
    width: number;
    mobileOpen: boolean;
    onClose: () => void;
    userRole?: string;
    activeYearId?: string;
}

export function AdminDrawer({
    width,
    mobileOpen,
    onClose,
    userRole,
    activeYearId,
}: AdminDrawerProps) {
    const pathname = usePathname();
    const { enqueueSnackbar } = useSnackbar();

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

    const activeYearIsActive = activeYearHref
        ? pathname.startsWith(activeYearHref)
        : false;

    const drawerContent = (
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

                    // Insert "Aktuální ročník" after "Rocniky"
                    const elements = [
                        <ListItem key={item.href} disablePadding>
                            <ListItemLinkButton
                                href={item.href}
                                selected={isActive}
                                onClick={onClose}
                                sx={selectedSx}
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
