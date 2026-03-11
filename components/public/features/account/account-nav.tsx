"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { List, ListItem, ListItemText, ListItemIcon, Paper } from "@mui/material";
import { Dashboard, Person, EventNote, Payment } from "@mui/icons-material";

const navItems = [
    { label: "Přehled", href: "/ucet", icon: <Dashboard /> },
    { label: "Profil", href: "/ucet/profil", icon: <Person /> },
    { label: "Registrace", href: "/ucet/registrace", icon: <EventNote /> },
    { label: "Platby", href: "/ucet/platby", icon: <Payment /> },
];

export function AccountNav() {
    const pathname = usePathname();

    return (
        <Paper elevation={1} sx={{ overflow: "hidden" }}>
            <List disablePadding>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <ListItem
                            key={item.href}
                            component={Link}
                            href={item.href}
                            sx={{
                                borderLeft: isActive ? "3px solid" : "3px solid transparent",
                                borderColor: isActive ? "primary.main" : "transparent",
                                backgroundColor: isActive ? "action.selected" : "transparent",
                                textDecoration: "none",
                                color: "text.primary",
                                "&:hover": {
                                    backgroundColor: "action.hover",
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: isActive ? "primary.main" : "text.secondary" }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontWeight: isActive ? 700 : 400,
                                }}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Paper>
    );
}
