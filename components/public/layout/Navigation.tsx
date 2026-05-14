"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { NavDropdown } from "./NavDropdown";

export interface NavSubItem {
    id: string;
    label: string;
    href: string;
    icon?: string | null;
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
                alignSelf: "stretch",
                alignItems: "center",
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
                        sx={{
                            position: "relative",
                            display: "flex",
                            alignSelf: "stretch",
                        }}
                        onMouseEnter={() =>
                            hasDropdown && setOpenDropdown(item.href)
                        }
                        onMouseLeave={() => setOpenDropdown(null)}
                    >
                        <LinkButton
                            href={item.href}
                            sx={{
                                color: isActive
                                    ? "primary.main"
                                    : "text.secondary",
                                fontWeight: isActive ? 700 : 400,
                                position: "relative",
                                overflow: "visible",
                                "&:hover": {
                                    color: "primary.main",
                                    backgroundColor: "background.paper",
                                },
                                "& .MuiTouchRipple-root": {
                                    display: "none",
                                },
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item.label}
                            <OrnamentalUnderline
                                sx={{
                                    position: "absolute",
                                    bottom: -5,
                                    left: 4,
                                    right: 4,
                                    mt: 0,
                                    opacity: isActive && !openDropdown ? 1 : 0,
                                    transition: "opacity 0.2s ease-in-out",
                                }}
                            />
                        </LinkButton>

                        {hasDropdown && (
                            <NavDropdown
                                open={isOpen}
                                items={item.subItems!.map((sub) => ({
                                    label: sub.label,
                                    icon: sub.icon,
                                    href: sub.href,
                                }))}
                                onClose={() =>
                                    setOpenDropdown(null)
                                }
                            />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
