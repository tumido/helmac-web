"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";

interface FormProgressProps {
    sections: { id: string; label: string }[];
}

export function FormProgress({ sections }: FormProgressProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const navRef = useRef<HTMLElement>(null);

    const getStickyOffset = useCallback(() => {
        const headerH =
            document.querySelector("header")?.getBoundingClientRect()
                .height ?? 64;
        return Math.round(headerH) + 16;
    }, []);

    useEffect(() => {
        const computeActive = () => {
            const threshold = getStickyOffset() + 60;
            let active = 0;
            for (let i = 0; i < sections.length; i++) {
                const el = document.getElementById(sections[i].id);
                if (!el) continue;
                if (el.getBoundingClientRect().top - threshold <= 0) {
                    active = i;
                }
            }
            setActiveIdx(active);
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
        window.addEventListener("resize", computeActive, {
            passive: true,
        });

        return () => {
            cancelAnimationFrame(initFrame);
            if (pendingFrame) cancelAnimationFrame(pendingFrame);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", computeActive);
        };
    }, [sections, getStickyOffset]);

    if (sections.length < 2) return null;

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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {sections.map((section, idx) => {
                const isActive = idx === activeIdx;
                const isPast = idx < activeIdx;

                return (
                    <Box
                        key={section.id}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        {idx > 0 && (
                            <Box
                                sx={{
                                    width: { xs: 24, sm: 40, md: 60 },
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
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.75,
                            }}
                        >
                            <Box
                                sx={{
                                    width: isActive ? 14 : 10,
                                    height: isActive ? 14 : 10,
                                    transform: "rotate(45deg)",
                                    backgroundColor:
                                        isActive || isPast
                                            ? "primary.main"
                                            : "transparent",
                                    border: "2px solid",
                                    borderColor:
                                        isActive || isPast
                                            ? "primary.main"
                                            : "divider",
                                    transition: "all 0.3s ease",
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    fontFamily: '"Cinzel", serif',
                                    fontSize: {
                                        xs: "0.6rem",
                                        sm: "0.7rem",
                                    },
                                    fontWeight: isActive ? 700 : 400,
                                    color: isActive
                                        ? "primary.main"
                                        : isPast
                                          ? "text.primary"
                                          : "text.secondary",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {section.label}
                            </Typography>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
