"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Button,
    Divider,
} from "@mui/material";

interface NavItem {
    label: string;
    href: string;
}

interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
    items: NavItem[];
}

export function MobileMenu({ open, onClose, items }: MobileMenuProps) {
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

                        return (
                            <ListItem key={item.href} disablePadding>
                                <ListItemButton
                                    component={Link}
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
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>

                <Divider sx={{ my: 2 }} />

                <Button
                    component={Link}
                    href="/registrace"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={onClose}
                    sx={{ fontWeight: 700 }}
                >
                    Registrace
                </Button>
            </Box>
        </Drawer>
    );
}
