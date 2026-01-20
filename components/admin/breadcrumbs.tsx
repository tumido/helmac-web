"use client";

import { Breadcrumbs as MuiBreadcrumbs, Typography, Link as MuiLink } from "@mui/material";
import { Home, NavigateNext } from "@mui/icons-material";
import Link from "next/link";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface AdminBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
    return (
        <MuiBreadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 2 }}
        >
            <MuiLink
                component={Link}
                href="/admin"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                    textDecoration: "none",
                    "&:hover": {
                        textDecoration: "underline",
                    },
                }}
            >
                <Home sx={{ mr: 0.5, fontSize: 20 }} />
                Dashboard
            </MuiLink>
            {items.map((item, index) =>
                item.href ? (
                    <MuiLink
                        key={index}
                        component={Link}
                        href={item.href}
                        sx={{
                            color: "text.secondary",
                            textDecoration: "none",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        {item.label}
                    </MuiLink>
                ) : (
                    <Typography key={index} color="text.primary">
                        {item.label}
                    </Typography>
                )
            )}
        </MuiBreadcrumbs>
    );
}
