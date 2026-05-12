"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Container,
    useScrollTrigger,
    Tooltip,
} from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import {
    Menu as MenuIcon,
    AccountCircle,
    PersonOutline,
} from "@mui/icons-material";
import { Navigation, NavItem } from "./Navigation";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "@/components/public/ui";
import type { NavigationData } from "@/lib/services/navigation";
import {
    STATIC_NAV_BEFORE,
    STATIC_NAV_AFTER,
} from "@/lib/navigation";
import type { PublicUserInfo } from "./ThemeWrapper";

interface HeaderProps {
    navigationData?: NavigationData;
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
}

export function Header({
    navigationData,
    registrationOpen,
    publicUser,
}: HeaderProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 50,
    });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navItems: NavItem[] = useMemo(() => {
        const beforeItems: NavItem[] =
            STATIC_NAV_BEFORE.map((item) => {
                if (
                    item.href === "/program" &&
                    navigationData?.program &&
                    navigationData.program.length > 1
                ) {
                    return {
                        label: item.label,
                        href: item.href,
                        subItems:
                            navigationData.program.map(
                                (sub) => ({
                                    id: sub.id,
                                    label: sub.label,
                                    href: `${item.href}?tab=${sub.id}`,
                                })
                            ),
                    };
                }
                return {
                    label: item.label,
                    href: item.href,
                };
            });

        const sectionItems: NavItem[] = (
            navigationData?.sections || []
        ).map((section) => {
            if (section.subItems.length > 1) {
                return {
                    label: section.label,
                    href: section.href,
                    subItems: section.subItems.map(
                        (sub) => ({
                            id: sub.id,
                            label: sub.label,
                            href: `${section.href}?tab=${sub.id}`,
                        })
                    ),
                };
            }
            return {
                label: section.label,
                href: section.href,
            };
        });

        const afterItems: NavItem[] =
            STATIC_NAV_AFTER.map((item) => ({
                label: item.label,
                href: item.href,
            }));

        return [
            ...beforeItems,
            ...sectionItems,
            ...afterItems,
        ];
    }, [navigationData]);

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
                        sx={{
                            justifyContent:
                                "space-between",
                        }}
                    >
                        <Typography
                            component={Link}
                            href="/"
                            variant="h5"
                            sx={{
                                fontFamily:
                                    '"Cinzel", serif',
                                fontWeight: 700,
                                color: "primary.main",
                                textDecoration: "none",
                                letterSpacing: "0.1em",
                            }}
                        >
                            HELMÁČ
                        </Typography>

                        <Navigation items={navItems} />

                        <Box
                            sx={{
                                display: {
                                    xs: "flex",
                                    lg: "none",
                                },
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <ThemeToggle size="small" />
                            {publicUser ? (
                                <Tooltip title="Můj účet">
                                    <IconButton
                                        component={Link}
                                        href="/ucet"
                                        sx={{
                                            color: "primary.main",
                                        }}
                                    >
                                        <AccountCircle />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Přihlásit se">
                                    <IconButton
                                        component={Link}
                                        href="/prihlaseni"
                                        color="inherit"
                                    >
                                        <PersonOutline />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <IconButton
                                color="inherit"
                                aria-label="otevřít menu"
                                edge="end"
                                onClick={
                                    handleDrawerToggle
                                }
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>

                        <Box
                            sx={{
                                display: {
                                    xs: "none",
                                    lg: "flex",
                                },
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <ThemeToggle />
                            {registrationOpen && (
                                <LinkButton
                                    href="/registrace"
                                    variant="contained"
                                    color="primary"
                                    sx={{
                                        fontWeight: 700,
                                        px: 3,
                                    }}
                                >
                                    Registrace
                                </LinkButton>
                            )}
                            {publicUser ? (
                                <Tooltip title="Můj účet">
                                    <IconButton
                                        component={Link}
                                        href="/ucet"
                                        sx={{
                                            color: "primary.main",
                                        }}
                                    >
                                        <AccountCircle />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Přihlásit se">
                                    <IconButton
                                        component={Link}
                                        href="/prihlaseni"
                                        color="inherit"
                                    >
                                        <PersonOutline />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <MobileMenu
                open={mobileOpen}
                onClose={handleDrawerToggle}
                items={navItems}
                registrationOpen={registrationOpen}
                publicUser={publicUser}
            />
        </>
    );
}
