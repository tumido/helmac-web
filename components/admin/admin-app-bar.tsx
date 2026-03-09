"use client";

import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useSidebarContext } from "@/lib/contexts/sidebar-context";

interface AdminAppBarProps {
    drawerWidth: number;
    onMenuClick: () => void;
}

export function AdminAppBar({
    drawerWidth,
    onMenuClick,
}: AdminAppBarProps) {
    const { sidebarYear } = useSidebarContext();

    const title = sidebarYear
        ? `Ročník ${sidebarYear.year} — ${sidebarYear.title}`
        : "Administrace";

    const subtitle = sidebarYear
        ? "Správa ročníku"
        : undefined;

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
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { md: "none" } }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap component="div">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
