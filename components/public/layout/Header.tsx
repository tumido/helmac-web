"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Menu as MenuIcon } from "@mui/icons-material";
import { GameIcon } from "@/lib/icons";
import { Navigation, NavItem } from "./Navigation";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "@/components/public/ui";
import type { NavigationData } from "@/lib/services/navigation";
import { STATIC_NAV_BEFORE, STATIC_NAV_AFTER } from "@/lib/navigation";
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
        const beforeItems: NavItem[] = STATIC_NAV_BEFORE.map((item) => {
            if (
                item.href === "/program" &&
                navigationData?.program &&
                navigationData.program.length > 1
            ) {
                return {
                    label: item.label,
                    href: item.href,
                    subItems: navigationData.program.map((sub) => ({
                        id: sub.id,
                        label: sub.label,
                        href: `${item.href}?tab=${sub.id}`,
                    })),
                };
            }
            return {
                label: item.label,
                href: item.href,
            };
        });

        const sectionItems: NavItem[] = (navigationData?.sections || []).map(
            (section) => {
                if (section.subItems.length > 1) {
                    return {
                        label: section.label,
                        href: section.href,
                        subItems: section.subItems.map((sub) => ({
                            id: sub.id,
                            label: sub.label,
                            href: `${section.href}?tab=${sub.id}`,
                            icon: sub.icon,
                        })),
                    };
                }
                return {
                    label: section.label,
                    href: section.href,
                };
            }
        );

        const afterItems: NavItem[] = STATIC_NAV_AFTER.map((item) => ({
            label: item.label,
            href: item.href,
        }));

        return [...beforeItems, ...sectionItems, ...afterItems];
    }, [navigationData]);

    return (
        <>
            <AppBar
                position="sticky"
                elevation={trigger ? 4 : 0}
                sx={{
                    backgroundColor: "background.paper",
                    backgroundImage: "none",
                    transition: "all 0.3s ease-in-out",
                    borderColor: "divider",
                    overflow: "visible",
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar
                        disableGutters
                        sx={{
                            justifyContent: "space-between",
                            pb: 0,
                        }}
                    >
                        <Box
                            component={Link}
                            href="/"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                textDecoration: "none",
                            }}
                        >
                            <Image
                                src="/images/helmac-logo-centered.svg"
                                alt="HELMÁČ"
                                width={30}
                                height={42}
                                priority
                            />
                            <Typography
                                variant="h5"
                                sx={{
                                    fontFamily: '"Cinzel", serif',
                                    fontWeight: 700,
                                    color: "#898787",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                HELMÁČ
                            </Typography>
                        </Box>

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
                                        <GameIcon name="visored-helm" sx={{ fontSize: "1.5rem" }} />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Přihlásit se">
                                    <IconButton
                                        component={Link}
                                        href="/prihlaseni"
                                        color="inherit"
                                    >
                                        <GameIcon name="skeleton-key" sx={{ fontSize: "1.5rem" }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <IconButton
                                color="inherit"
                                aria-label="otevřít menu"
                                edge="end"
                                onClick={handleDrawerToggle}
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
                                <UserMenu />
                            ) : (
                                <Tooltip title="Přihlásit se">
                                    <IconButton
                                        component={Link}
                                        href="/prihlaseni"
                                        color="inherit"
                                    >
                                        <GameIcon name="skeleton-key" sx={{ fontSize: "1.5rem" }} />
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
