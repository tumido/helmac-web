"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Box } from "@mui/material";
import {
    extractMarkdownToc,
    buildTocIdMap,
} from "@/lib/utils/markdown-toc-helpers";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { TableOfContents } from "./TableOfContents";

interface ContentWithTocProps {
    content: string;
    showToc: boolean;
}

export function ContentWithToc({ content, showToc }: ContentWithTocProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const mobileTocRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [tocTop, setTocTop] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(64);
    const [mobileTocHeight, setMobileTocHeight] = useState(0);
    const [mobileSticky, setMobileSticky] = useState(false);

    const { tocItems, tocIdMap } = useMemo(() => {
        if (!showToc) return { tocItems: [], tocIdMap: undefined };
        const items = extractMarkdownToc(content);
        return { tocItems: items, tocIdMap: buildTocIdMap(items) };
    }, [content, showToc]);

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

        if (mobileTocRef.current) {
            const tocH = mobileTocRef.current.getBoundingClientRect().height;
            setMobileTocHeight(tocH);
        }
        setMobileSticky(rect.top < headerH);
    }, [getHeaderHeight]);

    useEffect(() => {
        if (!hasToc) return;

        requestAnimationFrame(updatePosition);
        window.addEventListener("scroll", updatePosition, { passive: true });
        window.addEventListener("resize", updatePosition, { passive: true });

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [hasToc, updatePosition]);

    if (!hasToc) {
        return <MarkdownContent content={content} />;
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

            <MarkdownContent content={content} tocIds={tocIdMap} />

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
