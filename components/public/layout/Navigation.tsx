"use client";

import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";

interface NavItem {
    label: string;
    href: string;
}

interface NavigationProps {
    items: NavItem[];
}

export function Navigation({ items }: NavigationProps) {
    const pathname = usePathname();

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

                return (
                    <LinkButton
                        key={item.href}
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
                );
            })}
        </Box>
    );
}
