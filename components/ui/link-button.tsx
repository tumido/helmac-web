"use client";

import {
    Button,
    ButtonProps,
    IconButton,
    IconButtonProps,
    ListItemButton,
    ListItemButtonProps,
} from "@mui/material";
import Link from "next/link";
import { forwardRef } from "react";

interface LinkButtonProps extends Omit<ButtonProps, "href"> {
    href: string;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
    function LinkButton({ href, ...props }, ref) {
        return (
            <Button
                component={Link}
                href={href}
                ref={ref}
                {...props}
            />
        );
    }
);

interface IconLinkButtonProps extends Omit<IconButtonProps, "href"> {
    href: string;
}

export const IconLinkButton = forwardRef<HTMLAnchorElement, IconLinkButtonProps>(
    function IconLinkButton({ href, ...props }, ref) {
        return (
            <IconButton
                component={Link}
                href={href}
                ref={ref}
                {...props}
            />
        );
    }
);

interface ListItemLinkButtonProps extends Omit<ListItemButtonProps, "href"> {
    href: string;
}

export const ListItemLinkButton = forwardRef<HTMLAnchorElement, ListItemLinkButtonProps>(
    function ListItemLinkButton({ href, ...props }, ref) {
        return (
            <ListItemButton
                component={Link}
                href={href}
                ref={ref}
                {...props}
            />
        );
    }
);
