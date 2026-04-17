"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { TocItem } from "@/lib/utils/toc-helpers";

interface TableOfContentsProps {
    items: TocItem[];
    variant: "sidebar" | "horizontal";
}

export function TableOfContents({ items, variant }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");
    const navRef = useRef<HTMLElement>(null);

    // Auto-scroll the horizontal TOC to center the active pill
    useEffect(() => {
        if (!activeId || variant !== "horizontal" || !navRef.current) return;
        const nav = navRef.current;
        const activeEl = nav.querySelector(`[data-toc-id="${activeId}"]`) as HTMLElement | null;
        if (activeEl) {
            const scrollTarget = activeEl.offsetLeft - nav.offsetWidth / 2 + activeEl.offsetWidth / 2;
            nav.scrollTo({ left: scrollTarget, behavior: "smooth" });
        }
    }, [activeId, variant]);

    useEffect(() => {
        const headingElements = items
            .map((item) => document.getElementById(item.id))
            .filter(Boolean) as HTMLElement[];

        if (headingElements.length === 0) return;

        // Track which heading is active based on scroll position
        const handleScroll = () => {
            let current = "";
            for (const el of headingElements) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= 120) {
                    current = el.id;
                }
            }
            if (current) {
                setActiveId(current);
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, [items]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, []);

    if (variant === "horizontal") {
        return (
            <Box
                ref={navRef}
                component="nav"
                sx={{
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    py: 1.5,
                    px: 0.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                {items.map((item) => (
                    <Box
                        key={item.id}
                        data-toc-id={item.id}
                        component="a"
                        href={`#${item.id}`}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleClick(e, item.id)}
                        sx={{
                            flexShrink: 0,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "16px",
                            fontSize: item.level === 3 ? "0.75rem" : "0.8125rem",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s",
                            color: activeId === item.id ? "primary.main" : "text.secondary",
                            backgroundColor: activeId === item.id ? "action.selected" : "action.hover",
                            fontWeight: activeId === item.id ? 600 : 400,
                            "&:hover": {
                                backgroundColor: "action.selected",
                                color: "primary.main",
                            },
                        }}
                    >
                        {item.text}
                    </Box>
                ))}
            </Box>
        );
    }

    return (
        <Box component="nav">
            <Typography
                variant="overline"
                sx={{
                    display: "block",
                    mb: 1.5,
                    fontWeight: 600,
                    color: "text.secondary",
                    letterSpacing: "0.08em",
                }}
            >
                Obsah
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {items.map((item) => (
                    <Box
                        key={item.id}
                        component="a"
                        href={`#${item.id}`}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleClick(e, item.id)}
                        sx={{
                            display: "block",
                            pl: item.level === 3 ? 2 : 0,
                            py: 0.5,
                            pr: 1,
                            borderLeft: "2px solid",
                            borderColor: activeId === item.id ? "primary.main" : "transparent",
                            fontSize: item.level === 3 ? "0.8125rem" : "0.875rem",
                            lineHeight: 1.4,
                            textDecoration: "none",
                            color: activeId === item.id ? "primary.main" : "text.secondary",
                            fontWeight: activeId === item.id ? 600 : 400,
                            transition: "all 0.2s",
                            "&:hover": {
                                color: "primary.main",
                                borderColor: "primary.light",
                            },
                        }}
                    >
                        {item.text}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
