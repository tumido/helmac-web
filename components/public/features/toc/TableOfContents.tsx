"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { TocItem } from "@/lib/utils/toc-helpers";
import { FilterChips } from "@/components/public/ui/FilterChips";

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
        const activeEl = nav.querySelector(
            `[data-key="${activeId}"]`
        ) as HTMLElement | null;
        if (activeEl) {
            const scrollTarget =
                activeEl.offsetLeft -
                nav.offsetWidth / 2 +
                activeEl.offsetWidth / 2;
            nav.scrollTo({ left: scrollTarget, behavior: "smooth" });
        }
    }, [activeId, variant]);

    const getStickyOffset = useCallback(() => {
        const headerH =
            document.querySelector("header")?.getBoundingClientRect().height ??
            64;
        const tocH =
            variant === "horizontal" && navRef.current
                ? navRef.current.getBoundingClientRect().height
                : 0;
        return Math.round(headerH + tocH) + 16;
    }, [variant]);

    useEffect(() => {
        const computeActive = () => {
            const threshold = getStickyOffset() + 20;

            let active = "";
            let firstVisible = "";
            for (const item of items) {
                const el = document.getElementById(item.id);
                if (!el) continue;
                const top = el.getBoundingClientRect().top;
                if (top - threshold <= 0) {
                    active = item.id;
                } else {
                    if (!firstVisible && top < window.innerHeight) {
                        firstVisible = item.id;
                    }
                    break;
                }
            }
            setActiveId(active || firstVisible);
        };

        const initFrame = requestAnimationFrame(computeActive);

        let pendingFrame = 0;
        const onScroll = () => {
            if (pendingFrame) return;
            pendingFrame = requestAnimationFrame(() => {
                pendingFrame = 0;
                computeActive();
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", computeActive, { passive: true });

        return () => {
            cancelAnimationFrame(initFrame);
            if (pendingFrame) cancelAnimationFrame(pendingFrame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", computeActive);
        };
    }, [items, getStickyOffset]);

    const handleClick = useCallback(
        (id: string) => {
            const el = document.getElementById(id);
            if (!el) return;
            const top =
                el.getBoundingClientRect().top +
                window.scrollY -
                getStickyOffset();
            window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        },
        [getStickyOffset]
    );

    const handleAnchorClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
            e.preventDefault();
            handleClick(id);
        },
        [handleClick]
    );

    if (variant === "horizontal") {
        return (
            <Box ref={navRef} component="nav">
                <FilterChips
                    items={items.map((item) => ({
                        key: item.id,
                        label: item.text,
                    }))}
                    selectedKey={activeId}
                    onSelect={(key) => {
                        if (key) handleClick(key);
                    }}
                    sx={{ py: 1.5, px: 0.5 }}
                />
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
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                            handleAnchorClick(e, item.id)
                        }
                        sx={{
                            display: "block",
                            pl: item.level === 3 ? 2 : 0,
                            py: 0.5,
                            pr: 1,
                            borderLeft: "2px solid",
                            borderColor:
                                activeId === item.id
                                    ? "primary.main"
                                    : "transparent",
                            fontSize:
                                item.level === 3 ? "0.8125rem" : "0.875rem",
                            lineHeight: 1.4,
                            textDecoration: "none",
                            color:
                                activeId === item.id
                                    ? "primary.main"
                                    : "text.secondary",
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
