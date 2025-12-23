"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Box,
    Container,
    useScrollTrigger,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { Navigation } from "./Navigation";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "@/components/public/ui";

const navItems = [
    { label: "Program", href: "/program" },
    { label: "Pravidla", href: "/pravidla" },
    { label: "Galerie", href: "/galerie" },
    { label: "Novinky", href: "/novinky" },
    { label: "Archiv", href: "/archiv" },
];

export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 50,
    });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <>
            <AppBar
                position="sticky"
                elevation={trigger ? 4 : 0}
                sx={{
                    backgroundColor: trigger
                        ? "background.paper"
                        : "transparent",
                    transition: "all 0.3s ease-in-out",
                    borderBottom: trigger ? 1 : 0,
                    borderColor: "divider",
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar
                        disableGutters
                        sx={{ justifyContent: "space-between" }}
                    >
                        <Typography
                            component={Link}
                            href="/"
                            variant="h5"
                            sx={{
                                fontFamily: '"Cinzel", serif',
                                fontWeight: 700,
                                color: "primary.main",
                                textDecoration: "none",
                                letterSpacing: "0.1em",
                            }}
                        >
                            HELMAC
                        </Typography>

                        <Navigation items={navItems} />

                        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1 }}>
                            <ThemeToggle size="small" />
                            <IconButton
                                color="inherit"
                                aria-label="otevrit menu"
                                edge="end"
                                onClick={handleDrawerToggle}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>

                        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
                            <ThemeToggle />
                            <Button
                                component={Link}
                                href="/registrace"
                                variant="contained"
                                color="secondary"
                                sx={{
                                    fontWeight: 700,
                                    px: 3,
                                }}
                            >
                                Registrace
                            </Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <MobileMenu
                open={mobileOpen}
                onClose={handleDrawerToggle}
                items={navItems}
            />
        </>
    );
}
