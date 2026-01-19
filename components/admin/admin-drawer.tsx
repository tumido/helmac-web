"use client";

import { usePathname } from "next/navigation";
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography,
} from "@mui/material";
import { ListItemLinkButton } from "@/components/ui/link-button";
import {
    Dashboard,
    CalendarMonth,
    Article,
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

const menuItems: MenuItemType[] = [
    { text: "Dashboard", href: "/admin", icon: Dashboard },
    { text: "Rocniky", href: "/admin/rocniky", icon: CalendarMonth },
    { text: "Stranky", href: "/admin/stranky", icon: Article },
    { text: "Novinky", href: "/admin/novinky", icon: Newspaper },
    { text: "Galerie", href: "/admin/galerie", icon: PhotoLibrary },
    { divider: true },
    {
        text: "Uzivatele",
        href: "/admin/uzivatele",
        icon: People,
        roles: ["SUPER_ADMIN"],
    },
];

interface AdminDrawerProps {
    width: number;
    mobileOpen: boolean;
    onClose: () => void;
    userRole?: string;
}

export function AdminDrawer({
    width,
    mobileOpen,
    onClose,
    userRole,
}: AdminDrawerProps) {
    const pathname = usePathname();

    const filteredMenuItems = menuItems.filter((item) => {
        if ("divider" in item) return true;
        if (!item.roles) return true;
        return userRole && item.roles.includes(userRole);
    });

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

                    return (
                        <ListItem key={item.href} disablePadding>
                            <ListItemLinkButton
                                href={item.href}
                                selected={isActive}
                                onClick={onClose}
                                sx={{
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
                                }}
                            >
                                <ListItemIcon>
                                    <Icon />
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemLinkButton>
                        </ListItem>
                    );
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
