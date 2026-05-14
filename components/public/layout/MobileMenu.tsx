"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemText,
    Button,
} from "@mui/material";
import { LinkButton, ListItemLinkButton } from "@/components/ui/link-button";
import { publicLogout } from "@/lib/actions/public/auth";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { GameIcon } from "@/lib/icons";
import { NavItem } from "./Navigation";
import type { PublicUserInfo } from "./ThemeWrapper";

interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
    items: NavItem[];
    registrationOpen?: boolean;
    publicUser?: PublicUserInfo | null;
}

export function MobileMenu({
    open,
    onClose,
    items,
    registrationOpen,
    publicUser,
}: MobileMenuProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab");

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            elevation={0}
            sx={{
                "& .MuiDrawer-paper": {
                    width: 280,
                    backgroundColor: "background.paper",
                    borderLeft: "1.5px solid",
                    borderColor: "primary.main",
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 1,
                    }}
                >
                    <Image
                        src="/images/helmac-logo-centered.svg"
                        alt="HELMÁČ"
                        width={48}
                        height={48}
                    />
                </Box>

                <List disablePadding>
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        const hasSubItems =
                            item.subItems && item.subItems.length > 0;

                        if (hasSubItems) {
                            return (
                                <Box key={item.href}>
                                    <ListItem disablePadding>
                                        <ListItemLinkButton
                                            href={item.href}
                                            onClick={onClose}
                                            disableRipple
                                            sx={{
                                                "&:hover": {
                                                    backgroundColor:
                                                        "transparent",
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{
                                                    fontFamily: '"Cinzel", serif',
                                                    fontWeight: 400,
                                                    color: "text.primary",
                                                    textTransform: "uppercase",
                                                    fontSize: "0.875rem",
                                                    letterSpacing: "0.1em",
                                                }}
                                            />
                                        </ListItemLinkButton>
                                    </ListItem>
                                    <Box sx={{ pl: 2 }}>
                                        {item.subItems!.map((sub) => {
                                            const isSubActive =
                                                isActive &&
                                                activeTab === sub.id;

                                            return (
                                                <ListItem
                                                    key={sub.id}
                                                    disablePadding
                                                >
                                                    <ListItemLinkButton
                                                        href={sub.href}
                                                        onClick={onClose}
                                                        disableRipple
                                                        sx={{
                                                            py: 0.5,
                                                            gap: 1,
                                                            borderBottom:
                                                                "1.5px solid transparent",
                                                            borderColor:
                                                                isSubActive
                                                                    ? "primary.main"
                                                                    : "transparent",
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
                                                                display:
                                                                    "inline-flex",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <GameIcon
                                                                name={
                                                                    sub.icon ||
                                                                    "polar-star"
                                                                }
                                                                sx={{
                                                                    fontSize:
                                                                        "1.5em",
                                                                    color: "primary.main",
                                                                }}
                                                            />
                                                        </Box>
                                                        <ListItemText
                                                            primary={sub.label}
                                                            primaryTypographyProps={{
                                                                fontFamily:
                                                                    '"Cinzel", serif',
                                                                fontSize:
                                                                    "0.875rem",
                                                                letterSpacing:
                                                                    "0.1em",
                                                                color: isSubActive
                                                                    ? "primary.main"
                                                                    : "text.secondary",
                                                                fontWeight:
                                                                    isSubActive
                                                                        ? 700
                                                                        : 400,
                                                            }}
                                                        />
                                                    </ListItemLinkButton>
                                                </ListItem>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            );
                        }

                        return (
                            <Box key={item.href}>
                                <ListItem disablePadding>
                                    <ListItemLinkButton
                                        href={item.href}
                                        onClick={onClose}
                                        sx={{
                                            position: "relative",
                                            overflow: "visible",
                                            "&:hover": {
                                                backgroundColor:
                                                    "transparent",
                                            },
                                        }}
                                    >
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontFamily: '"Cinzel", serif',
                                                fontWeight: isActive
                                                    ? 700
                                                    : 400,
                                                color: isActive
                                                    ? "primary.main"
                                                    : "text.primary",
                                                textTransform: "uppercase",
                                                fontSize: "0.875rem",
                                                letterSpacing: "0.1em",
                                            }}
                                        />
                                    </ListItemLinkButton>
                                </ListItem>
                                {isActive && (
                                    <OrnamentalUnderline
                                        sx={{
                                            mx: 2,
                                            mt: 0,
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </List>

                <Box sx={{ mt: 2, px: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {registrationOpen && (
                        <LinkButton
                            href="/registrace"
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={onClose}
                            sx={{ fontWeight: 700 }}
                        >
                            Registrace
                        </LinkButton>
                    )}

                    {publicUser ? (
                        <>
                            <LinkButton
                                href="/ucet"
                                variant="outlined"
                                fullWidth
                                onClick={onClose}
                                startIcon={
                                    <GameIcon
                                        name="visored-helm"
                                        sx={{ fontSize: "1.5rem" }}
                                    />
                                }
                                sx={{
                                    color: "primary.main",
                                    borderColor: "primary.main",
                                }}
                            >
                                Můj účet
                            </LinkButton>
                            <form action={publicLogout}>
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    fullWidth
                                    onClick={onClose}
                                    startIcon={
                                        <GameIcon
                                            name="boot-prints"
                                            sx={{ fontSize: "1.5rem" }}
                                        />
                                    }
                                    sx={{
                                        color: "text.secondary",
                                        borderColor: "divider",
                                    }}
                                >
                                    Odhlásit se
                                </Button>
                            </form>
                        </>
                    ) : (
                    <LinkButton
                        href="/prihlaseni"
                        variant="outlined"
                        fullWidth
                        onClick={onClose}
                        startIcon={<GameIcon name="skeleton-key" sx={{ fontSize: "1.5rem" }} />}
                    >
                        Přihlásit se
                    </LinkButton>
                )}
                </Box>
            </Box>
        </Drawer>
    );
}
