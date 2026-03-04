"use client";

import { usePathname } from "next/navigation";
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    Divider,
} from "@mui/material";
import { LinkButton, ListItemLinkButton } from "@/components/ui/link-button";
import { NavItem } from "./Navigation";

interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
    items: NavItem[];
    registrationOpen?: boolean;
}

export function MobileMenu({ open, onClose, items, registrationOpen }: MobileMenuProps) {
    const pathname = usePathname();

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                "& .MuiDrawer-paper": {
                    width: 280,
                    backgroundColor: "background.default",
                },
            }}
        >
            <Box sx={{ p: 3 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        color: "primary.main",
                        letterSpacing: "0.1em",
                        mb: 2,
                    }}
                >
                    HELMAC
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <List disablePadding>
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        const hasSubItems = item.subItems && item.subItems.length > 0;

                        return (
                            <Box key={item.href}>
                                <ListItem disablePadding>
                                    <ListItemLinkButton
                                        href={item.href}
                                        onClick={onClose}
                                        sx={{
                                            borderLeft: isActive
                                                ? "3px solid"
                                                : "3px solid transparent",
                                            borderColor: isActive
                                                ? "primary.main"
                                                : "transparent",
                                            backgroundColor: isActive
                                                ? "action.selected"
                                                : "transparent",
                                        }}
                                    >
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontWeight: isActive ? 700 : 400,
                                            }}
                                        />
                                    </ListItemLinkButton>
                                </ListItem>

                                {hasSubItems && item.subItems!.map((sub) => (
                                    <ListItem key={sub.id} disablePadding>
                                        <ListItemLinkButton
                                            href={sub.href}
                                            onClick={onClose}
                                            sx={{
                                                pl: 4,
                                                borderLeft: "3px solid transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary={sub.label}
                                                primaryTypographyProps={{
                                                    fontSize: "0.875rem",
                                                    color: "text.secondary",
                                                }}
                                            />
                                        </ListItemLinkButton>
                                    </ListItem>
                                ))}
                            </Box>
                        );
                    })}
                </List>

                {registrationOpen && (
                    <>
                        <Divider sx={{ my: 2 }} />

                        <LinkButton
                            href="/registrace"
                            variant="contained"
                            color="secondary"
                            fullWidth
                            onClick={onClose}
                            sx={{ fontWeight: 700 }}
                        >
                            Registrace
                        </LinkButton>
                    </>
                )}
            </Box>
        </Drawer>
    );
}
