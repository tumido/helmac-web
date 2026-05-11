"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface FormProgressProps {
    sections: { id: string; label: string }[];
}

export function FormProgress({ sections }: FormProgressProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const navRef = useRef<HTMLElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const userScrollingRef = useRef(false);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const getScrollThreshold = useCallback(() => {
        const navBottom =
            navRef.current?.getBoundingClientRect().bottom;
        if (navBottom != null) return Math.round(navBottom) + 16;
        const headerH =
            document.querySelector("header")?.getBoundingClientRect()
                .height ?? 64;
        return Math.round(headerH) + 80;
    }, []);

    const updateScrollIndicators = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(
            el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
        );
    }, []);

    useEffect(() => {
        const computeActive = () => {
            const threshold = getScrollThreshold();
            let active = 0;
            for (let i = 0; i < sections.length; i++) {
                const el = document.getElementById(sections[i].id);
                if (!el) continue;
                if (el.getBoundingClientRect().top - threshold <= 0) {
                    active = i;
                }
            }
            if (!userScrollingRef.current) {
                setActiveIdx((prev) => {
                    if (prev !== active && navRef.current) {
                        const step = navRef.current.querySelector(
                            `[data-step="${active}"]`,
                        );
                        step?.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "center",
                        });
                    }
                    return active;
                });
            }
        };

        const initFrame = requestAnimationFrame(() => {
            computeActive();
            updateScrollIndicators();
        });

        let pendingFrame = 0;
        const onScroll = () => {
            if (pendingFrame) return;
            pendingFrame = requestAnimationFrame(() => {
                pendingFrame = 0;
                computeActive();
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", computeActive, {
            passive: true,
        });

        const scrollEl = scrollRef.current;
        scrollEl?.addEventListener("scroll", updateScrollIndicators, {
            passive: true,
        });

        return () => {
            cancelAnimationFrame(initFrame);
            if (pendingFrame) cancelAnimationFrame(pendingFrame);
            clearTimeout(scrollTimerRef.current);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", computeActive);
            scrollEl?.removeEventListener(
                "scroll",
                updateScrollIndicators,
            );
        };
    }, [sections, getScrollThreshold, updateScrollIndicators]);

    const scrollTo = useCallback(
        (sectionId: string, idx: number) => {
            const el = document.getElementById(sectionId);
            if (!el) return;

            userScrollingRef.current = true;
            clearTimeout(scrollTimerRef.current);

            setActiveIdx(idx);
            const step = navRef.current?.querySelector(
                `[data-step="${idx}"]`,
            );
            step?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
            });

            const offset = getScrollThreshold();
            const top =
                el.getBoundingClientRect().top +
                window.scrollY -
                offset;
            window.scrollTo({ top, behavior: "smooth" });

            scrollTimerRef.current = setTimeout(() => {
                userScrollingRef.current = false;
            }, 800);
        },
        [getScrollThreshold],
    );

    const scrollNav = useCallback((direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({
            left: direction === "left" ? -120 : 120,
            behavior: "smooth",
        });
    }, []);

    if (sections.length < 2) return null;

    const indicatorSx = {
        position: "absolute" as const,
        top: 0,
        bottom: 0,
        width: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        cursor: "pointer",
        transition: "opacity 0.2s",
        "& .MuiSvgIcon-root": {
            fontSize: 18,
            color: "text.secondary",
        },
    };

    return (
        <Box
            ref={navRef}
            component="nav"
            sx={{
                position: "sticky",
                top: { xs: 56, sm: 64 },
                zIndex: 10,
                backgroundColor: "background.default",
                py: 3,
                mb: 2,
                mx: { xs: -2, sm: 0 },
            }}
        >
            <Box sx={{ position: "relative" }}>
                <ButtonBase
                    onClick={() => scrollNav("left")}
                    sx={{
                        ...indicatorSx,
                        left: 0,
                        opacity: canScrollLeft ? 1 : 0,
                        pointerEvents: canScrollLeft
                            ? "auto"
                            : "none",
                        background: (theme) =>
                            `linear-gradient(to right, ${theme.palette.background.default} 50%, transparent)`,
                    }}
                >
                    <ChevronLeftIcon />
                </ButtonBase>
                <Box
                    ref={scrollRef}
                    sx={{
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": {
                            display: "none",
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "fit-content",
                            mx: "auto",
                            px: { xs: 1, sm: 4 },
                        }}
                    >
                        {sections.map((section, idx) => {
                            const isActive = idx === activeIdx;
                            const isPast = idx < activeIdx;

                            return (
                                <Box
                                    key={section.id}
                                    data-step={idx}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {idx > 0 && (
                                        <Box
                                            sx={{
                                                width: {
                                                    xs: 24,
                                                    sm: 40,
                                                    md: 60,
                                                },
                                                height: 1,
                                                backgroundColor:
                                                    isPast || isActive
                                                        ? "primary.main"
                                                        : "divider",
                                                transition:
                                                    "background-color 0.3s",
                                            }}
                                        />
                                    )}
                                    <ButtonBase
                                        onClick={() =>
                                            scrollTo(section.id, idx)
                                        }
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 0.75,
                                            borderRadius: 1,
                                            px: 0.5,
                                            py: 0.25,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: isActive
                                                    ? 14
                                                    : 10,
                                                height: isActive
                                                    ? 14
                                                    : 10,
                                                transform:
                                                    "rotate(45deg)",
                                                backgroundColor:
                                                    isActive || isPast
                                                        ? "primary.main"
                                                        : "transparent",
                                                border: "2px solid",
                                                borderColor:
                                                    isActive || isPast
                                                        ? "primary.main"
                                                        : "divider",
                                                transition:
                                                    "all 0.3s ease",
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily:
                                                    '"Cinzel", serif',
                                                fontSize: {
                                                    xs: "0.6rem",
                                                    sm: "0.7rem",
                                                },
                                                fontWeight: isActive
                                                    ? 700
                                                    : 400,
                                                color: isActive
                                                    ? "primary.main"
                                                    : isPast
                                                      ? "text.primary"
                                                      : "text.secondary",
                                                textTransform:
                                                    "uppercase",
                                                letterSpacing:
                                                    "0.05em",
                                                whiteSpace: "nowrap",
                                                transition:
                                                    "all 0.3s ease",
                                            }}
                                        >
                                            {section.label}
                                        </Typography>
                                    </ButtonBase>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
                <ButtonBase
                    onClick={() => scrollNav("right")}
                    sx={{
                        ...indicatorSx,
                        right: 0,
                        opacity: canScrollRight ? 1 : 0,
                        pointerEvents: canScrollRight
                            ? "auto"
                            : "none",
                        background: (theme) =>
                            `linear-gradient(to left, ${theme.palette.background.default} 50%, transparent)`,
                    }}
                >
                    <ChevronRightIcon />
                </ButtonBase>
            </Box>
        </Box>
    );
}
