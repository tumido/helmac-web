"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Fade } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { GameIcon } from "@/lib/icons";

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
                            <Fade in={isOpen} timeout={150}>
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: "calc(100% - 4px)",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        minWidth: 180,
                                        zIndex: 1200,
                                        display: isOpen ? "block" : "none",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "relative",
                                            backgroundColor: "background.paper",
                                            pt: 1.5,
                                            pb: 1.5,
                                        }}
                                    >
                                        <OrnamentalUnderline
                                            sx={{
                                                position: "absolute",
                                                top: 1,
                                                left: -1,
                                                right: -1,
                                                mt: 0,
                                                mx: 0,
                                            }}
                                        />
                                        {item.subItems!.map((sub) => (
                                            <LinkButton
                                                key={sub.id}
                                                href={sub.href}
                                                onClick={() =>
                                                    setOpenDropdown(null)
                                                }
                                                sx={{
                                                    display: "flex",
                                                    width: "100%",
                                                    textAlign: "left",
                                                    px: 1.5,
                                                    py: 0.75,
                                                    gap: 1,
                                                    color: "text.primary",
                                                    fontWeight: 400,
                                                    fontSize: "0.875rem",
                                                    borderRadius: 0,
                                                    justifyContent:
                                                        "flex-start",
                                                    textTransform: "none",
                                                    whiteSpace: "nowrap",
                                                    borderBottom:
                                                        "1.5px solid transparent",
                                                    "&:hover": {
                                                        backgroundColor:
                                                            "transparent",
                                                        color: "primary.main",
                                                        borderColor:
                                                            "primary.main",
                                                    },
                                                }}
                                            >
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        width: "1.5em",
                                                        flexShrink: 0,
                                                        mr: 1,
                                                        display: "inline-flex",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <GameIcon
                                                        name={sub.icon || "polar-star"}
                                                        sx={{
                                                            fontSize:
                                                                "1.5em",
                                                            color: "primary.main",
                                                        }}
                                                    />
                                                </Box>
                                                {sub.label}
                                            </LinkButton>
                                        ))}
                                        <OrnamentalUnderline
                                            sx={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: -1,
                                                right: -1,
                                                mt: 0,
                                                mx: 0,
                                                transform: "scaleY(-1)",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Fade>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
