"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Paper, Fade } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";

export interface NavSubItem {
    id: string;
    label: string;
    href: string;
}

export interface NavItem {
    label: string;
    href: string;
    subItems?: NavSubItem[];
}

interface NavigationProps {
    items: NavItem[];
}

export function Navigation({ items }: NavigationProps) {
    const pathname = usePathname();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    return (
        <Box
            component="nav"
            sx={{
                display: { xs: "none", lg: "flex" },
                gap: 1,
            }}
        >
            {items.map((item) => {
                const isActive = pathname === item.href;
                const hasDropdown = item.subItems && item.subItems.length > 0;
                const isOpen = openDropdown === item.href;

                return (
                    <Box
                        key={item.href}
                        sx={{ position: "relative" }}
                        onMouseEnter={() => hasDropdown && setOpenDropdown(item.href)}
                        onMouseLeave={() => setOpenDropdown(null)}
                    >
                        <LinkButton
                            href={item.href}
                            sx={{
                                color: isActive ? "primary.main" : "text.secondary",
                                fontWeight: isActive ? 700 : 400,
                                position: "relative",
                                "&::after": {
                                    content: '""',
                                    position: "absolute",
                                    bottom: 6,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: isActive ? "60%" : 0,
                                    height: 2,
                                    backgroundColor: "primary.main",
                                    transition: "width 0.2s ease-in-out",
                                },
                                "&:hover": {
                                    color: "primary.main",
                                },
                                "&:hover::after": {
                                    width: "60%",
                                },
                            }}
                        >
                            {item.label}
                        </LinkButton>

                        {hasDropdown && (
                            <Fade in={isOpen} timeout={150}>
                                <Paper
                                    elevation={4}
                                    sx={{
                                        position: "absolute",
                                        top: "100%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        minWidth: 180,
                                        py: 0.5,
                                        zIndex: 1200,
                                        display: isOpen ? "block" : "none",
                                    }}
                                >
                                    {item.subItems!.map((sub) => (
                                        <LinkButton
                                            key={sub.id}
                                            href={sub.href}
                                            onClick={() => setOpenDropdown(null)}
                                            sx={{
                                                display: "block",
                                                width: "100%",
                                                textAlign: "left",
                                                px: 2,
                                                py: 0.75,
                                                color: "text.primary",
                                                fontWeight: 400,
                                                fontSize: "0.875rem",
                                                borderRadius: 0,
                                                justifyContent: "flex-start",
                                                textTransform: "none",
                                                whiteSpace: "nowrap",
                                                "&:hover": {
                                                    backgroundColor: "action.hover",
                                                    color: "primary.main",
                                                },
                                            }}
                                        >
                                            {sub.label}
                                        </LinkButton>
                                    ))}
                                </Paper>
                            </Fade>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
