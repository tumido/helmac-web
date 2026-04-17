"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { richContentSx } from "@/lib/utils/rich-content-sx";
import { injectHeadingIds, extractTocItems } from "@/lib/utils/toc-helpers";
import { TableOfContents } from "./TableOfContents";

interface ContentWithTocProps {
    html: string;
    showToc: boolean;
}

export function ContentWithToc({ html, showToc }: ContentWithTocProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const mobileTocRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [tocTop, setTocTop] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(64);
    const [mobileTocHeight, setMobileTocHeight] = useState(0);
    const [mobileSticky, setMobileSticky] = useState(false);

    const { processedHtml, tocItems } = useMemo(() => {
        if (!showToc) return { processedHtml: html, tocItems: [] };
        const processed = injectHeadingIds(html);
        const items = extractTocItems(processed);
        return { processedHtml: processed, tocItems: items };
    }, [html, showToc]);

    const hasToc = showToc && tocItems.length >= 2;

    const getHeaderHeight = useCallback(() => {
        const header = document.querySelector("header");
        return header ? header.getBoundingClientRect().height : 64;
    }, []);

    const updatePosition = useCallback(() => {
        if (!contentRef.current) return;
        const rect = contentRef.current.getBoundingClientRect();
        const headerH = getHeaderHeight();
        setHeaderHeight(headerH);
        setTocTop(Math.max(rect.top, headerH + 8));
        setVisible(rect.bottom > 0 && rect.top < window.innerHeight);

        // Mobile: switch to fixed once the TOC's natural position scrolls above the header
        if (mobileTocRef.current) {
            const tocH = mobileTocRef.current.getBoundingClientRect().height;
            setMobileTocHeight(tocH);
        }
        // Content top is above header bottom → TOC should be fixed
        setMobileSticky(rect.top < headerH);
    }, [getHeaderHeight]);

    useEffect(() => {
        if (!hasToc) return;

        updatePosition();
        window.addEventListener("scroll", updatePosition, { passive: true });
        window.addEventListener("resize", updatePosition, { passive: true });

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [hasToc, updatePosition]);

    if (!hasToc) {
        return (
            <Typography
                variant="body1"
                component="div"
                sx={richContentSx}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }

    return (
        <Box ref={contentRef}>
            {/* Mobile TOC: in-flow when not scrolled, fixed under header when scrolled */}
            <Box
                ref={mobileTocRef}
                sx={{
                    display: { xs: "block", lg: "none" },
                    ...(mobileSticky
                        ? {
                              position: "fixed",
                              top: headerHeight,
                              left: 0,
                              right: 0,
                              zIndex: 1099,
                          }
                        : {
                              position: "relative",
                          }),
                    backgroundColor: "background.default",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    px: 2,
                    mb: mobileSticky ? 0 : 3,
                    opacity: visible ? 1 : 0,
                    pointerEvents: visible ? "auto" : "none",
                    transition: "opacity 0.2s ease",
                }}
            >
                <TableOfContents items={tocItems} variant="horizontal" />
            </Box>

            {/* Spacer to prevent content jump when mobile TOC becomes fixed */}
            {mobileSticky && (
                <Box
                    sx={{
                        display: { xs: "block", lg: "none" },
                        height: mobileTocHeight,
                    }}
                />
            )}

            {/* Single content render — heading IDs exist once in the DOM */}
            <Typography
                variant="body1"
                component="div"
                sx={richContentSx}
                dangerouslySetInnerHTML={{ __html: processedHtml }}
            />

            {/* Desktop: fixed TOC in right viewport margin */}
            <Box
                sx={{
                    position: "fixed",
                    top: tocTop,
                    right: 24,
                    width: 200,
                    maxHeight: `calc(100vh - ${tocTop + 30}px)`,
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                    display: { xs: "none", lg: "block" },
                    opacity: visible ? 1 : 0,
                    pointerEvents: visible ? "auto" : "none",
                    transition: "opacity 0.2s ease",
                }}
            >
                <TableOfContents items={tocItems} variant="sidebar" />
            </Box>
        </Box>
    );
}
