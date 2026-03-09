"use client";

import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Button,
} from "@mui/material";
import { Menu as MenuIcon, Logout } from "@mui/icons-material";
import { signOut } from "next-auth/react";
import { useSidebarContext } from "@/lib/contexts/sidebar-context";

interface AdminAppBarProps {
    drawerWidth: number;
    onMenuClick: () => void;
    userName?: string;
}

export function AdminAppBar({
    drawerWidth,
    onMenuClick,
    userName,
}: AdminAppBarProps) {
    const { sidebarYear } = useSidebarContext();

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/admin/login" });
    };

    const title = sidebarYear
        ? `Ročník ${sidebarYear.year} — ${sidebarYear.title}`
        : "Administrace";

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { md: `calc(100% - ${drawerWidth}px)` },
                ml: { md: `${drawerWidth}px` },
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { md: "none" } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {userName && (
                        <Typography variant="body2">{userName}</Typography>
                    )}
                    <Button
                        color="inherit"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                    >
                        Odhlasit
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
