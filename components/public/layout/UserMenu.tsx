"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, IconButton } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import { NavDropdown } from "./NavDropdown";
import { publicLogout } from "@/lib/actions/public/auth";

const items = [
    { label: "Můj účet", icon: "visored-helm", href: "/ucet" },
    { label: "Odhlásit se", icon: "boot-prints", action: publicLogout },
];

export function UserMenu() {
    const [open, setOpen] = useState(false);

    return (
        <Box
            sx={{
                position: "relative",
                display: "flex",
                alignSelf: "stretch",
                alignItems: "center",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <IconButton
                component={Link}
                href="/ucet"
                sx={{ color: "primary.main" }}
            >
                <GameIcon
                    name="visored-helm"
                    sx={{ fontSize: "1.5rem" }}
                />
            </IconButton>

            <NavDropdown
                open={open}
                items={items}
                onClose={() => setOpen(false)}
            />
        </Box>
    );
}
