"use client";

import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { AdminAppBar } from "./admin-app-bar";
import { AdminDrawer } from "./admin-drawer";

const DRAWER_WIDTH = 260;

interface AdminLayoutProps {
    children: React.ReactNode;
    userName?: string;
    userRole?: string;
}

export function AdminLayout({ children, userName, userRole }: AdminLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <SnackbarProvider
            maxSnack={3}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
            <Box sx={{ display: "flex", minHeight: "100vh" }}>
                <AdminAppBar
                    drawerWidth={DRAWER_WIDTH}
                    onMenuClick={() => setMobileOpen(!mobileOpen)}
                    userName={userName}
                />
                <AdminDrawer
                    width={DRAWER_WIDTH}
                    mobileOpen={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    userRole={userRole}
                />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, sm: 3 },
                        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                        backgroundColor: "background.default",
                        overflow: "hidden",
                    }}
                >
                    <Toolbar />
                    {children}
                </Box>
            </Box>
        </SnackbarProvider>
    );
}
